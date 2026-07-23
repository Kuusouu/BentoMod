import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaTag } from "react-icons/fa6";
import { MdCreateNewFolder } from "react-icons/md";
import {
	VscChevronDown,
	VscChevronRight,
	VscFolder,
	VscFolderOpened,
	VscNewFolder,
} from "react-icons/vsc";
import Checkbox from "./ui/Checkbox";
import Switch from "./ui/Switch";
import "./InstallModPanel.css";

const heroImages = import.meta.glob("../assets/hero/*.png", { eager: true }) as Record<
	string,
	{ default: string }
>;

type FolderRecord = {
	id: string;
	name: string;
	is_root?: boolean;
};

type ModInput = {
	path: string;
	mod_name?: string;
	mod_type?: string;
	is_dir?: boolean;
	contains_uassets?: boolean;
	contains_raw_assets?: boolean;
	auto_to_bento?: boolean;
	auto_force_legacy?: boolean;
	[key: string]: any;
};

type ModSetting = {
	enabled: boolean;
	obfuscate: boolean;
	toBento: boolean;
	forceLegacy: boolean;
	hybrid: boolean;
	compression: string;
	customName: string;
	selectedTags: string[];
	installSubfolder: string | null;
	path: string;
};

type InstallModPanelProps = {
	mods: ModInput[];
	allTags: string[];
	folders?: FolderRecord[];
	currentFolderId?: string;
	onCreateTag?: (tag: string) => void;
	onDeleteTag?: (tag: string) => void;
	onCreateFolder?: (name: string) => Promise<string | null>;
	onInstall: (modsWithSettings: any[]) => void;
	onCancel: () => void;
	onNewTag: (callback: (tag: string) => void) => void;
	onNewFolder: (callback: (name: string) => void) => void;
	onMergeHybrid?: (path1: string, path2: string) => void;
	characterData: any[];
};

type TreeNodeMap = {
	id?: string;
	name: string;
	children: Record<string, TreeNodeMap>;
	isVirtual: boolean;
	fullPath?: string;
	originalName?: string;
};

type TreeNode = Omit<TreeNodeMap, "children"> & {
	children: TreeNode[];
};

type FolderNodeProps = {
	node: TreeNode;
	selectedFolderId?: string | null;
	onSelect: (folderId: string) => void;
	depth?: number;
};

// Folder tree helper functions
const buildTree = (folders: FolderRecord[]): TreeNodeMap => {
	const root: TreeNodeMap = { id: "root", name: "root", children: {}, isVirtual: true };
	const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

	sortedFolders.forEach((folder) => {
		const parts = folder.id.split(/[/\\]/);
		let current = root;

		parts.forEach((part: string, index: number) => {
			if (!current.children[part]) {
				current.children[part] = {
					name: part,
					children: {},
					isVirtual: true,
					fullPath: parts.slice(0, index + 1).join("/"),
				};
			}
			current = current.children[part];

			if (index === parts.length - 1) {
				current.id = folder.id;
				current.isVirtual = false;
				current.originalName = folder.name;
			}
		});
	});

	return root;
};

const convertToArray = (node: TreeNodeMap): TreeNode[] => {
	if (!node.children) return [];
	const children = Object.values(node.children).map((child) => ({
		...child,
		children: convertToArray(child),
	}));
	children.sort((a, b) => a.name.localeCompare(b.name));
	return children;
};

// Folder node component for the tree
const FolderNode = ({ node, selectedFolderId, onSelect, depth = 0 }: FolderNodeProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const hasChildren = node.children && node.children.length > 0;
	const isSelected = selectedFolderId === node.id;

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		if (!node.isVirtual && node.id) {
			onSelect(node.id);
		} else {
			setIsOpen(!isOpen);
		}
	};

	return (
		<div className="imp-folder-node">
			<div
				className={`imp-folder-item ${isSelected ? "selected" : ""} ${node.isVirtual ? "virtual" : ""}`}
				style={{ paddingLeft: `${depth * 16 + 8}px` }}
			>
				<button
					type="button"
					className="folder-toggle unstyled-icon-button"
					onClick={(e) => {
						e.stopPropagation();
						setIsOpen(!isOpen);
					}}
					disabled={!hasChildren}
					aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.name}`}
					aria-expanded={hasChildren ? isOpen : undefined}
				>
					{hasChildren ? (
						isOpen ? (
							<VscChevronDown />
						) : (
							<VscChevronRight />
						)
					) : (
						<span style={{ width: 16 }} />
					)}
				</button>
				<button
					type="button"
					className="folder-select-button unstyled-button"
					onClick={handleClick}
				>
					<span className="folder-icon">
						{isSelected || isOpen ? <VscFolderOpened /> : <VscFolder />}
					</span>
					<span className="folder-name">{node.name}</span>
				</button>
			</div>

			{hasChildren && isOpen && (
				<div className="imp-folder-children">
					{node.children.map((child: TreeNode) => (
						<FolderNode
							key={child.fullPath || child.id}
							node={child}
							selectedFolderId={selectedFolderId}
							onSelect={onSelect}
							depth={depth + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const isBentoLocked = (mod: any = {}) => mod.is_dir;

const buildInitialSettings = (
	mods: ModInput[] = [],
	currentFolderId?: string,
): Record<number, ModSetting> => {
	return mods.reduce(
		(acc, mod, idx) => {
			const locked = isBentoLocked(mod);
			const defaultToBento = mod.is_dir ? !locked : Boolean(mod.auto_to_bento);
			const canApplyPatches = mod.contains_uassets !== false; // Default to true if undefined
			const isHybrid = Boolean(mod.contains_uassets && mod.contains_raw_assets);

			// For mods with no uassets, we skip bento (IoStore logic) and likely enforce legacy
			const effectiveToBento = isHybrid
				? true
				: !canApplyPatches
					? false
					: locked
						? false
						: defaultToBento;
			const forceLegacy = isHybrid
				? false
				: mod.contains_uassets === false
					? true
					: mod.auto_force_legacy || false;

			acc[idx] = {
				enabled: true,
				obfuscate: false,
				toBento: effectiveToBento,
				forceLegacy: forceLegacy,
				hybrid: isHybrid,
				compression: "Oodle",
				customName: "",
				selectedTags: [],
				installSubfolder:
					currentFolderId && currentFolderId !== "all" ? currentFolderId : null, // Per-mod install destination
				path: mod.path,
			};
			return acc;
		},
		{} as Record<number, ModSetting>,
	);
};

function parseModType(modType: string | undefined): {
	character: string | null;
	category: string;
	additional: string[];
} {
	if (!modType) return { character: null, category: "Unknown", additional: [] };

	// Extract additional categories
	const bracketMatch = modType.match(/\[(.*?)\]/);
	const additional = bracketMatch ? bracketMatch[1].split(",").map((s) => s.trim()) : [];

	// Clean base string
	const base = modType.replace(/\[.*?\]/, "").trim();
	let character: string | null = null;
	let category = base;

	// Split Character - Category
	if (base.includes(" - ")) {
		const parts = base.split(" - ");
		if (parts.length >= 2) {
			const maybeCategory = parts.pop();
			category = maybeCategory ?? category;
			character = parts.join(" - ");
		}
	}

	return { character, category, additional };
}

export default function InstallModPanel({
	mods,
	allTags,
	folders = [],
	currentFolderId,
	onCreateTag,
	onDeleteTag,
	onCreateFolder,
	onInstall,
	onCancel,
	onNewTag,
	onNewFolder,
	onMergeHybrid,
	characterData,
}: InstallModPanelProps) {
	const [openDropdown, setOpenDropdown] = useState<number | null>(null);
	const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
	const [modSettings, setModSettings] = useState<Record<number, ModSetting>>(() =>
		buildInitialSettings(mods, currentFolderId),
	);
	// Removed global selectedFolderId since we now track it per-mod in modSettings
	const [isCreatingFolder, setIsCreatingFolder] = useState(false);

	// Folder tree data
	const rootFolder = useMemo(() => folders.find((f) => f.is_root), [folders]);
	const subfolders = useMemo(() => folders.filter((f) => !f.is_root), [folders]);
	const treeData = useMemo(() => {
		const root = buildTree(subfolders);
		return convertToArray(root);
	}, [subfolders]);

	useEffect(() => {
		console.log("[InstallModPanel] Received mods:", mods.length, mods);
		setModSettings((prev) => {
			const newSettings = buildInitialSettings(mods, currentFolderId);
			const prevSettingsArray = Object.values(prev);

			return mods.reduce(
				(acc, mod, idx) => {
					// Try to find existing settings by path
					const existing = prevSettingsArray.find((s) => s.path === mod.path);
					acc[idx] = existing !== undefined ? existing : newSettings[idx];
					return acc;
				},
				{} as Record<number, ModSetting>,
			);
		});
	}, [currentFolderId, mods]);

	useEffect(() => {
		const handleClickOutside = () => setOpenDropdown(null);
		window.addEventListener("click", handleClickOutside);
		return () => window.removeEventListener("click", handleClickOutside);
	}, []);

	const updateModSetting = (idx: number, key: keyof ModSetting, value: any) => {
		if (key === "toBento" && isBentoLocked(mods[idx])) {
			return;
		}

		setModSettings((prev) => ({
			...prev,
			[idx]: { ...prev[idx], [key]: value },
		}));
	};

	const handleAddTag = (idx: number, tag: string) => {
		if (!tag.trim()) return;
		const currentTags = modSettings[idx]?.selectedTags || [];
		if (!currentTags.includes(tag.trim())) {
			updateModSetting(idx, "selectedTags", [...currentTags, tag.trim()]);
		}
	};

	const handleRemoveTag = (idx: number, tagToRemove: string) => {
		const currentTags = modSettings[idx]?.selectedTags || [];
		updateModSetting(
			idx,
			"selectedTags",
			currentTags.filter((t) => t !== tagToRemove),
		);
	};

	const enabledCount = useMemo(() => {
		return mods.filter((_, idx) => modSettings[idx]?.enabled !== false).length;
	}, [mods, modSettings]);

	const handleInstall = useCallback(() => {
		const modsToInstall = mods
			.map((mod, idx) => ({
				...mod,
				...modSettings[idx],
				toBento: isBentoLocked(mod) ? false : modSettings[idx]?.toBento || false,
				forceLegacy: modSettings[idx]?.forceLegacy || false,
				installSubfolder: modSettings[idx]?.installSubfolder || "",
			}))
			.filter((m) => m.enabled !== false);
		onInstall(modsToInstall);
	}, [mods, modSettings, onInstall]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				const activeEl = document.activeElement as HTMLElement | null;
				const activeTag = activeEl?.tagName?.toLowerCase();

				// Ignore if user is typing in an input (except our custom name input)
				if (activeTag === "input" || activeTag === "textarea") {
					if (!activeEl?.classList.contains("mod-name-input")) {
						return;
					}
				}

				// Ignore if user is focused on a button (except our install button)
				if (activeTag === "button") {
					if (!activeEl?.classList.contains("btn-install")) {
						return;
					}
				}

				if (enabledCount > 0) {
					e.preventDefault();
					handleInstall();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [enabledCount, handleInstall]);

	const handleNewFolder = (targetModIdx: number) => {
		if (onNewFolder) {
			onNewFolder(async (name) => {
				if (!name?.trim()) return;
				setIsCreatingFolder(true);
				try {
					if (onCreateFolder) {
						const newFolderId = await onCreateFolder(name.trim());
						if (newFolderId && typeof targetModIdx === "number") {
							updateModSetting(targetModIdx, "installSubfolder", newFolderId);
						}
					}
				} catch (err) {
					console.error("Failed to create folder:", err);
				} finally {
					setIsCreatingFolder(false);
				}
			});
		}
	};

	return (
		<div className="install-mod-overlay">
			<motion.div
				className="install-mod-panel"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.15 }}
			>
				<div className="install-header">
					<h2>Install Mods</h2>
					<button type="button" className="close-btn" onClick={onCancel}>
						×
					</button>
				</div>

				{/* Mod Cards */}
				<div className="imp-mods-section">
					{mods.length > 1 &&
						mods.some((m) => m.contains_uassets !== false) &&
						mods.some((m) => m.contains_raw_assets && m.contains_uassets === false) && (
							<div
								className="install-hybrid-merge-banner"
								style={{
									background: "rgba(76, 175, 80, 0.1)",
									border: "1px solid #4CAF50",
									padding: "12px 16px",
									borderRadius: "8px",
									marginBottom: "16px",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<div
									className="hybrid-merge-text"
									style={{ display: "flex", flexDirection: "column" }}
								>
									<span
										className="hybrid-merge-title"
										style={{ color: "#4CAF50", fontWeight: "bold" }}
									>
										Hybrid Match Detected
									</span>
									<span
										className="hybrid-merge-desc"
										style={{ fontSize: "0.9em", opacity: 0.8 }}
									>
										You dropped both cooked assets and raw assets. Would you
										like to merge them into a single Hybrid mod?
									</span>
								</div>
								<button
									type="button"
									className="btn-hybrid"
									onClick={() => {
										const uassetMod = mods.find(
											(m) => m.contains_uassets !== false,
										);
										const rawMod = mods.find(
											(m) =>
												m.contains_raw_assets &&
												m.contains_uassets === false,
										);
										if (uassetMod && rawMod && onMergeHybrid) {
											onMergeHybrid(uassetMod.path, rawMod.path);
										}
									}}
								>
									Merge as Hybrid
								</button>
							</div>
						)}
					{mods.length === 0 ? (
						<div className="install-empty-state">No mods detected in the drop.</div>
					) : (
						<div className="install-mod-grid">
							{mods.map((mod, idx) => {
								const bentoLocked = isBentoLocked(mod);
								const bentoTitle = bentoLocked
									? mod.is_dir
										? "Folder drops cannot be bentoed"
										: "Detected loose assets; bento handled automatically"
									: "Direct PAK - can bento if needed";
								const { character, category, additional } = parseModType(
									mod.mod_type,
								);
								const modLabel = mod.is_dir ? "Folder Drop" : "PAK File";
								return (
									<div
										className={`install-mod-card ${modSettings[idx]?.enabled === false ? "disabled" : ""}`}
										key={mod.path || idx}
									>
										{/* Left: Mod Options */}
										<div className="install-mod-card__left">
											<div className="install-mod-card__header">
												{mods.length > 1 && (
													<Checkbox
														aria-label={`Include ${mod.mod_name || mod.path}`}
														checked={
															modSettings[idx]?.enabled !== false
														}
														onChange={(checked) =>
															updateModSetting(
																idx,
																"enabled",
																checked,
															)
														}
														size="md"
														color="primary"
													/>
												)}
												<div className="install-mod-card__title">
													<label
														className="field-label"
														htmlFor={`install-mod-custom-name-${idx}`}
													>
														Custom Name
													</label>
													<div className="mod-name-input-wrapper">
														<input
															id={`install-mod-custom-name-${idx}`}
															type="text"
															placeholder="Insert custom name here"
															value={
																modSettings[idx]?.customName || ""
															}
															onChange={(e) =>
																updateModSetting(
																	idx,
																	"customName",
																	e.target.value,
																)
															}
															className="mod-name-input"
														/>
														<span className="mod-name-suffix-hint">
															_9999999_P
														</span>
													</div>
													<span
														className="install-mod-card__hint"
														title={mod.path}
													>
														{modSettings[idx]?.customName
															? `${modSettings[idx].customName}_9999999_P.pak`
															: mod.mod_name}
													</span>
												</div>
												<span
													className={`install-mod-card__pill ${mod.is_dir ? "pill-folder" : "pill-pak"}`}
												>
													{modLabel}
												</span>
											</div>

											<div className="install-mod-card__badges">
												{character && (
													<span
														className={`character-badge ${character.startsWith("Multiple Heroes") ? "multi-hero" : ""}`}
													>
														{getHeroImage(character, characterData) && (
															<img
																src={getHeroImage(
																	character,
																	characterData,
																)}
																alt=""
															/>
														)}
														{character}
													</span>
												)}
												<span
													className={`category-badge ${category.toLowerCase().replace(/\s+/g, "-")}-badge`}
												>
													{category}
												</span>
												{additional.map((tag) => (
													<span
														key={tag}
														className={`additional-badge ${tag.toLowerCase().replace(/\s+/g, "-")}-badge`}
													>
														{tag}
													</span>
												))}
												{mod.contains_uassets === false && (
													<span
														className="no-uassets-badge"
														title="This mod contains Raw Assets (no UAsset files)"
													>
														Raw Assets
													</span>
												)}
											</div>

											<div className="install-mod-card__tags">
												<div className="install-mod-card__row">
													<span className="field-label">Tags</span>
													<div className="tags-cell">
														<div className="tags-list">
															{(
																modSettings[idx]?.selectedTags || []
															).map((tag) => (
																<span key={tag} className="tag">
																	<FaTag />
																	{tag}
																	<button
																		type="button"
																		className="tag-remove"
																		onClick={() =>
																			handleRemoveTag(
																				idx,
																				tag,
																			)
																		}
																	>
																		×
																	</button>
																</span>
															))}
														</div>
														{/* biome-ignore lint/a11y/noStaticElementInteractions: This wrapper only prevents tag controls from triggering their parent card. */}
														{/* biome-ignore lint/a11y/useKeyWithClickEvents: The wrapper performs no user action; its child controls are native buttons. */}
														<div
															className="add-tag-wrapper"
															onClick={(e) => e.stopPropagation()}
														>
															<button
																type="button"
																className="add-tag-btn"
																onClick={(e) => {
																	const rect =
																		e.currentTarget.getBoundingClientRect();
																	setDropdownPos({
																		x: rect.left,
																		y: rect.bottom,
																	});
																	setOpenDropdown(
																		openDropdown === idx
																			? null
																			: idx,
																	);
																}}
																title="Add Tag"
															>
																+
															</button>
															{openDropdown === idx && (
																<div
																	className="tag-dropdown"
																	style={{
																		position: "fixed",
																		top: dropdownPos.y,
																		left: dropdownPos.x,
																	}}
																>
																	<button
																		type="button"
																		className="dropdown-item unstyled-button"
																		onClick={() => {
																			onNewTag((tag) => {
																				if (tag?.trim()) {
																					handleAddTag(
																						idx,
																						tag,
																					);
																					if (onCreateTag)
																						onCreateTag(
																							tag,
																						);
																				}
																			});
																			setOpenDropdown(null);
																		}}
																	>
																		+ New Tag...
																	</button>
																	{allTags &&
																		allTags.length > 0 && (
																			<div className="dropdown-separator" />
																		)}
																	{allTags?.map((tag) => (
																		<div
																			key={tag}
																			className="dropdown-item"
																		>
																			<button
																				type="button"
																				className="dropdown-item-select unstyled-button"
																				onClick={() => {
																					handleAddTag(
																						idx,
																						tag,
																					);
																					setOpenDropdown(
																						null,
																					);
																				}}
																			>
																				<span className="dropdown-item-label">
																					{tag}
																				</span>
																			</button>
																			{onDeleteTag && (
																				<button
																					type="button"
																					className="dropdown-item-delete"
																					onClick={(
																						e,
																					) => {
																						e.stopPropagation();
																						onDeleteTag(
																							tag,
																						);
																					}}
																					title={`Delete "${tag}" tag`}
																				>
																					×
																				</button>
																			)}
																		</div>
																	))}
																</div>
															)}
														</div>
													</div>
												</div>
											</div>

											<div className="install-mod-card__footer">
												<Switch
													size="md"
													color="primary"
													checked={modSettings[idx]?.obfuscate || false}
													onChange={(value) =>
														updateModSetting(idx, "obfuscate", value)
													}
													className={`install-toggle obfuscate-toggle ${modSettings[idx]?.obfuscate ? "active" : ""}`}
													title="Encrypts IoStore with game's AES key to block FModel extraction"
												>
													<div className="install-toggle__text">
														<span className="install-toggle__label">
															Obfuscation
														</span>
														<span className="install-toggle__hint">
															{modSettings[idx]?.obfuscate
																? "IOStore will be AES encrypted"
																: "Encrypt mod to block Fmodel extraction"}
														</span>
													</div>
												</Switch>

												<Switch
													size="md"
													color="success"
													checked={modSettings[idx]?.hybrid || false}
													onChange={(value) => {
														if (
															mod.contains_uassets === false ||
															mod.contains_raw_assets === false
														)
															return;
														updateModSetting(idx, "hybrid", value);
														if (value) {
															updateModSetting(idx, "toBento", true);
															updateModSetting(
																idx,
																"forceLegacy",
																false,
															);
														}
													}}
													isDisabled={
														mod.contains_uassets === false ||
														mod.contains_raw_assets === false
													}
													className={`install-toggle hybrid-toggle ${mod.contains_uassets === false || mod.contains_raw_assets === false ? "locked" : modSettings[idx]?.hybrid ? "active" : ""}`}
													title="Generate a Hybrid IOStore bundle containing both raw assets and cooked uassets."
												>
													<div className="install-toggle__text">
														<span className="install-toggle__label">
															Hybrid IOStore
														</span>
														<span className="install-toggle__hint">
															{mod.contains_uassets === false ||
															mod.contains_raw_assets === false
																? "Needs raw and cooked assets"
																: modSettings[idx]?.hybrid
																	? "Hybrid bundle enabled"
																	: "Merge raw & cooked assets into IOStore"}
														</span>
													</div>
												</Switch>

												<Switch
													size="md"
													color="warning"
													checked={
														mod.contains_uassets === false
															? true
															: modSettings[idx]?.hybrid
																? false
																: modSettings[idx]?.forceLegacy ||
																	false
													}
													onChange={(value) => {
														if (mod.contains_uassets === false) return;
														updateModSetting(idx, "forceLegacy", value);
													}}
													isDisabled={
														mod.contains_uassets === false ||
														modSettings[idx]?.hybrid ||
														Boolean(
															mod.contains_uassets &&
																mod.contains_raw_assets,
														)
													}
													className={`install-toggle legacy-toggle ${mod.contains_uassets === false ? "active locked" : modSettings[idx]?.hybrid || (mod.contains_uassets && mod.contains_raw_assets) ? "locked" : modSettings[idx]?.forceLegacy ? "active" : ""}`}
													title="Use when making Audio/Config mods (mods that don't contain uassets)"
												>
													<div className="install-toggle__text">
														<span className="install-toggle__label">
															Legacy PAK Format
														</span>
														<span className="install-toggle__hint">
															{mod.contains_uassets === false
																? "Forced for non-UAsset mods"
																: mod.contains_uassets &&
																		mod.contains_raw_assets
																	? "Unavailable for Hybrid mods"
																	: modSettings[idx]?.forceLegacy
																		? "Skipping IoStore conversion"
																		: "Use for Audio/Config mods (Raw Assets)"}
														</span>
													</div>
												</Switch>

												{mod.contains_uassets !== false && (
													<Switch
														size="md"
														color="secondary"
														checked={
															modSettings[idx]?.hybrid
																? true
																: modSettings[idx]?.toBento || false
														}
														onChange={(value) =>
															updateModSetting(idx, "toBento", value)
														}
														isDisabled={
															bentoLocked || modSettings[idx]?.hybrid
														}
														className={`install-toggle bento-toggle ${bentoLocked || modSettings[idx]?.hybrid ? "locked" : ""} ${modSettings[idx]?.toBento ? "active" : ""}`}
														title={bentoTitle}
													>
														<div className="install-toggle__text">
															<span className="install-toggle__label">
																Send to Bento
															</span>
															<span className="install-toggle__hint">
																{bentoLocked
																	? mod.is_dir
																		? "Not available for folder drops"
																		: "Loose assets detected"
																	: "Bentos the pak into IOStore format"}
															</span>
														</div>
													</Switch>
												)}
											</div>
										</div>

										{/* Divider */}
										{folders.length > 0 && (
											<div className="install-mod-card__divider" />
										)}

										{/* Right: Folder Picker (inside card) */}
										{folders.length > 0 && (
											<div className="install-mod-card__right">
												<div className="imp-section-header">
													<MdCreateNewFolder />
													<span>Install to</span>
													<button
														type="button"
														className="imp-btn-new-folder"
														onClick={() => handleNewFolder(idx)}
														disabled={isCreatingFolder}
														title="Create new folder"
													>
														<VscNewFolder />
													</button>
												</div>

												<div className="imp-folder-tree-container">
													{/* Root folder */}
													{rootFolder && (
														<button
															type="button"
															className={`imp-folder-item root-item unstyled-button ${modSettings[idx]?.installSubfolder === rootFolder.id || !modSettings[idx]?.installSubfolder ? "selected" : ""}`}
															onClick={() =>
																updateModSetting(
																	idx,
																	"installSubfolder",
																	null,
																)
															}
														>
															<span className="folder-icon">
																<VscFolderOpened />
															</span>
															<span className="folder-name">
																{rootFolder.name}
															</span>
														</button>
													)}

													{/* Subfolders */}
													<div className="imp-folder-tree">
														{treeData.map((node: TreeNode) => (
															<FolderNode
																key={node.fullPath || node.id}
																node={node}
																selectedFolderId={
																	modSettings[idx]
																		?.installSubfolder
																}
																onSelect={(newId: string) =>
																	updateModSetting(
																		idx,
																		"installSubfolder",
																		newId,
																	)
																}
															/>
														))}
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="install-actions">
					<button type="button" onClick={onCancel} className="btn-cancel">
						Cancel
					</button>
					<button
						type="button"
						onClick={handleInstall}
						className="btn-install"
						disabled={enabledCount === 0}
					>
						Install {enabledCount} Mod(s)
					</button>
				</div>
			</motion.div>
		</div>
	);
}

function getHeroImage(
	heroName: string | null | undefined,
	characterData: any[],
): string | undefined {
	if (!heroName) return undefined;

	const baseName = heroName.includes(" - ") ? heroName.split(" - ")[0] : heroName;
	const char = characterData.find((c: any) => c.name === baseName);
	if (!char) return undefined;

	const key = `../assets/hero/${char.id}.png`;
	return heroImages[key]?.default;
}
