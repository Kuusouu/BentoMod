import { invoke } from "@tauri-apps/api/core";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IoMdWarning } from "react-icons/io";
import "./ContextMenu.css";

type ModRecord = {
	path: string;
	custom_name?: string;
	enabled?: boolean;
	is_iostore?: boolean;
	utoc_path?: string;
};

type FolderRecord = {
	id: string;
	name: string;
	is_root?: boolean;
};

type ContextMenuProps = {
	x: number;
	y: number;
	mod?: ModRecord | null;
	folder?: FolderRecord | null;
	onClose: () => void;
	onAssignTag: (tag: string) => void;
	onNewTag: (callback: (tag: string) => void) => void;
	onMoveTo: (folderId: string | null) => void;
	onMoveFolderTo?: (newParentId: string | null) => void;
	onCreateFolder: (options?: { moveFolderId?: string; parentId?: string }) => void;
	folders: FolderRecord[];
	onDelete: () => void;
	onToggle: () => void;
	onRename: () => void;
	onRenameFolder: () => void;
	onCheckConflicts?: () => void;
	onUpdateMod?: () => void;
	onSendToVfxUpdater?: (mod: ModRecord) => void;
	onExtractAssets?: (mod: ModRecord) => void;
	allTags: string[];
	onDeleteTag?: (tag: string) => void;
	gamePath?: string;
	holdToDelete?: boolean;
};

const ContextMenu = ({
	x,
	y,
	mod,
	folder,
	onClose,
	onAssignTag,
	onNewTag,
	onMoveTo,
	onMoveFolderTo,
	onCreateFolder,
	folders,
	onDelete,
	onToggle,
	onRename,
	onRenameFolder,
	onCheckConflicts,
	onUpdateMod,
	onSendToVfxUpdater,
	onExtractAssets,
	allTags,
	onDeleteTag,
	gamePath,
	holdToDelete = true,
}: ContextMenuProps) => {
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [adjustedPos, setAdjustedPos] = useState({ x, y });

	useEffect(() => {
		const handleClickOutside = () => {
			onClose();
		};
		window.addEventListener("click", handleClickOutside);
		return () => window.removeEventListener("click", handleClickOutside);
	}, [onClose]);

	useEffect(() => {
		return () => {
			if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
		};
	}, []);

	// Adjust position to prevent menu from going off-screen
	// Using useLayoutEffect to run after DOM updates but before paint
	useLayoutEffect(() => {
		// First reset to original position
		setAdjustedPos({ x, y });

		// Then measure and adjust in next frame
		requestAnimationFrame(() => {
			if (menuRef.current) {
				const menuRect = menuRef.current.getBoundingClientRect();
				const viewportHeight = window.innerHeight;
				const viewportWidth = window.innerWidth;

				let newY = y;
				let newX = x;

				// If menu would go below viewport, flip it to open above cursor
				if (y + menuRect.height > viewportHeight - 10) {
					newY = y - menuRect.height;
				}

				// If menu would go off right edge, shift it left
				if (x + menuRect.width > viewportWidth - 10) {
					newX = viewportWidth - menuRect.width - 10;
				}

				// Ensure menu doesn't go above or to left of viewport
				newY = Math.max(10, newY);
				newX = Math.max(10, newX);

				if (newX !== x || newY !== y) {
					setAdjustedPos({ x: newX, y: newY });
				}
			}
		});
	}, [x, y]);

	const startDelete = () => {
		if (!holdToDelete) {
			onDelete();
			onClose();
			return;
		}
		setIsDeleting(true);
		deleteTimeoutRef.current = setTimeout(() => {
			onDelete();
			onClose();
		}, 2000);
	};

	const cancelDelete = () => {
		setIsDeleting(false);
		if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
	};

	const handleDeleteDown = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		startDelete();
	};

	const handleDeleteUp = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		cancelDelete();
	};

	const handleDeleteKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if ((e.key !== "Enter" && e.key !== " ") || e.repeat) return;
		e.preventDefault();
		e.stopPropagation();
		startDelete();
	};

	const handleDeleteKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key !== "Enter" && e.key !== " ") return;
		e.preventDefault();
		e.stopPropagation();
		cancelDelete();
	};

	const handleRenameClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onRename();
		onClose();
	};

	// Re-position a submenu when it would otherwise clip the viewport. The
	// submenu is normally anchored at `top: -4px; left: 100%`. On enter we
	// measure it and switch to bottom-anchored / right-anchored placement if
	// needed. Runs on every enter so it stays correct when the parent menu
	// is opened in different spots.
	const handleSubmenuEnter = (e: React.SyntheticEvent<HTMLDivElement>) => {
		const trigger = e.currentTarget;
		const submenu = trigger.querySelector<HTMLElement>(":scope > .submenu");
		if (!submenu) return;

		// Reset prior overrides so the measurement reflects the default anchor.
		submenu.style.top = "";
		submenu.style.bottom = "";
		submenu.style.left = "";
		submenu.style.right = "";
		submenu.style.maxHeight = "";
		submenu.style.overflowY = "";

		requestAnimationFrame(() => {
			const triggerRect = trigger.getBoundingClientRect();
			const subRect = submenu.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const margin = 10;

			// Vertical: flip up if bottom edge clips
			if (subRect.bottom > vh - margin) {
				const spaceAbove = triggerRect.bottom - margin;
				const spaceBelow = vh - triggerRect.top - margin;
				if (spaceAbove > spaceBelow) {
					submenu.style.top = "auto";
					submenu.style.bottom = "-4px";
					if (subRect.height > spaceAbove) {
						submenu.style.maxHeight = `${spaceAbove}px`;
						submenu.style.overflowY = "auto";
					}
				} else {
					// Not enough room above either; cap height and scroll downward.
					submenu.style.maxHeight = `${spaceBelow}px`;
					submenu.style.overflowY = "auto";
				}
			}

			// Horizontal: flip left if right edge clips
			const projectedRight = triggerRect.right + subRect.width;
			if (projectedRight > vw - margin) {
				submenu.style.left = "auto";
				submenu.style.right = "100%";
			}
		});
	};

	if (folder) {
		// Compute the candidate destination parents:
		//   - the folder itself
		//   - any descendants (id starts with "<folder.id>/")
		//   - the folder's current parent (would be a no-op move)
		// are excluded.
		const rootFolder = folders.find((f) => f.is_root);
		const currentParentId: string | null = folder.id.includes("/")
			? folder.id.substring(0, folder.id.lastIndexOf("/"))
			: null;
		const moveCandidates = folders.filter((f) => {
			if (f.is_root) return false;
			if (f.id === folder.id) return false;
			if (f.id.startsWith(`${folder.id}/`)) return false;
			if (f.id === currentParentId) return false;
			return true;
		});
		const canMoveToRoot = currentParentId !== null;

		return (
			// biome-ignore lint/a11y/noStaticElementInteractions: This container only prevents menu commands from triggering the global outside-click listener.
			// biome-ignore lint/a11y/useKeyWithClickEvents: The container performs no action; its commands are native buttons.
			<div
				ref={menuRef}
				className="context-menu"
				style={{ top: adjustedPos.y, left: adjustedPos.x }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="context-menu-header">{folder.name}</div>
				<button
					type="button"
					className="context-menu-item unstyled-button"
					onClick={async () => {
						try {
							// Construct full folder path from gamePath + folder.id
							const separator = gamePath?.includes("\\") ? "\\" : "/";
							const fullPath =
								gamePath && folder.id
									? `${gamePath}${separator}${folder.id}`
									: folder.id;
							await invoke("open_in_explorer", { path: fullPath });
						} catch (e) {
							console.error("Failed to open folder in explorer:", e);
						}
						onClose();
					}}
				>
					Open in Explorer
				</button>
				<button
					type="button"
					className="context-menu-item unstyled-button"
					onClick={async () => {
						onClose();
						try {
							// Construct full folder path from gamePath + folder.id
							const separator = gamePath?.includes("\\") ? "\\" : "/";
							const fullPath =
								gamePath && folder.id
									? `${gamePath}${separator}${folder.id}`
									: folder.id;
							await invoke("copy_to_clipboard", { text: fullPath });
						} catch (e) {
							console.error("Failed to copy folder path:", e);
						}
					}}
				>
					Copy Path
				</button>
				<div className="context-menu-separator" />
				<button
					type="button"
					className="context-menu-item unstyled-button"
					onClick={() => {
						onCreateFolder({ parentId: folder.id });
						onClose();
					}}
				>
					+ New Folder
				</button>

				{onMoveFolderTo && (
					<div
						className="context-menu-item submenu-trigger"
						role="menuitem"
						tabIndex={0}
						aria-haspopup="menu"
						onMouseEnter={handleSubmenuEnter}
						onFocus={handleSubmenuEnter}
					>
						Move to...
						<div className="submenu">
							{canMoveToRoot && (
								<button
									type="button"
									className="context-menu-item unstyled-button"
									onClick={() => {
										onMoveFolderTo(null);
										onClose();
									}}
								>
									Root ({rootFolder?.name || "~mods"})
								</button>
							)}
							<button
								type="button"
								className="context-menu-item unstyled-button"
								onClick={() => {
									onCreateFolder({ moveFolderId: folder.id });
									onClose();
								}}
							>
								+ New Folder...
							</button>
							{moveCandidates.length > 0 && (
								<>
									<div className="context-menu-separator" />
									<div
										className="scrollable-menu-list"
										style={{
											maxHeight: "300px",
											overflowY: "auto",
											paddingRight: "4px",
										}}
									>
										{moveCandidates.map((f) => (
											<button
												type="button"
												key={f.id}
												className="context-menu-item unstyled-button"
												onClick={() => {
													onMoveFolderTo(f.id);
													onClose();
												}}
											>
												{f.id}
											</button>
										))}
									</div>
								</>
							)}
							{moveCandidates.length === 0 && !canMoveToRoot && (
								<div
									className="context-menu-item"
									style={{ opacity: 0.5, cursor: "default" }}
								>
									No valid destinations
								</div>
							)}
						</div>
					</div>
				)}

				<button
					type="button"
					className="context-menu-item unstyled-button"
					onClick={(e) => {
						e.stopPropagation();
						onRenameFolder();
						onClose();
					}}
				>
					Rename Folder
				</button>
				<div className="context-menu-separator" />
				<button
					type="button"
					className={`context-menu-item danger unstyled-button ${isDeleting ? "holding" : ""}`}
					onMouseDown={handleDeleteDown}
					onMouseUp={handleDeleteUp}
					onMouseLeave={handleDeleteUp}
					onKeyDown={handleDeleteKeyDown}
					onKeyUp={handleDeleteKeyUp}
					onBlur={cancelDelete}
				>
					<div className="danger-bg" />
					<span style={{ position: "relative", zIndex: 2 }}>
						{isDeleting ? "Hold to delete..." : "Delete Folder (Hold 2s)"}
					</span>
				</button>
			</div>
		);
	}

	if (!mod) return null;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: This container only prevents menu commands from triggering the global outside-click listener.
		// biome-ignore lint/a11y/useKeyWithClickEvents: The container performs no action; its commands are native buttons.
		<div
			ref={menuRef}
			className="context-menu"
			style={{ top: adjustedPos.y, left: adjustedPos.x }}
			onClick={(e) => e.stopPropagation()}
		>
			<div className="context-menu-header">
				{mod.custom_name || mod.path.split(/[/\\]/).pop()}
			</div>

			<div
				className="context-menu-item submenu-trigger"
				role="menuitem"
				tabIndex={0}
				aria-haspopup="menu"
				onMouseEnter={handleSubmenuEnter}
				onFocus={handleSubmenuEnter}
			>
				Assign Tag...
				<div className="submenu">
					<button
						type="button"
						className="context-menu-item unstyled-button"
						onClick={() => {
							onNewTag((tag) => {
								if (tag) onAssignTag(tag);
							});
							onClose();
						}}
					>
						+ New Tag...
					</button>
					{allTags && allTags.length > 0 && <div className="context-menu-separator" />}
					{allTags?.map((tag) => (
						<div key={tag} className="context-menu-item">
							<button
								type="button"
								className="context-menu-item-action unstyled-button"
								onClick={() => {
									onAssignTag(tag);
									onClose();
								}}
							>
								<span className="context-menu-item-label">{tag}</span>
							</button>
							{onDeleteTag && (
								<button
									type="button"
									className="context-menu-item-delete"
									onClick={(e) => {
										e.stopPropagation();
										onDeleteTag(tag);
										onClose();
									}}
									title={`Delete "${tag}" tag`}
								>
									×
								</button>
							)}
						</div>
					))}
				</div>
			</div>

			<div
				className="context-menu-item submenu-trigger"
				role="menuitem"
				tabIndex={0}
				aria-haspopup="menu"
				onMouseEnter={handleSubmenuEnter}
				onFocus={handleSubmenuEnter}
			>
				Move to...
				<div className="submenu">
					<button
						type="button"
						className="context-menu-item unstyled-button"
						onClick={() => {
							onCreateFolder();
							onClose();
						}}
					>
						+ New Folder...
					</button>
					<div className="context-menu-separator" />
					<div
						className="scrollable-menu-list"
						style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}
					>
						{folders
							.filter((f) => !f.is_root)
							.map((f) => (
								<button
									type="button"
									key={f.id}
									className="context-menu-item unstyled-button"
									onClick={() => {
										onMoveTo(f.id);
										onClose();
									}}
								>
									{f.id}
								</button>
							))}
					</div>
					<div className="context-menu-separator" />
					<button
						type="button"
						className="context-menu-item unstyled-button"
						onClick={() => {
							onMoveTo(null);
							onClose();
						}}
					>
						Root ({folders.find((f) => f.is_root)?.name || "~mods"})
					</button>
				</div>
			</div>

			<div className="context-menu-separator" />

			<button
				type="button"
				className="context-menu-item unstyled-button"
				onClick={() => {
					if (onCheckConflicts) onCheckConflicts();
					onClose();
				}}
			>
				Check Conflicts{" "}
				<IoMdWarning
					className="warning-icon-small"
					style={{ fill: "var(--accent-primary)" }}
				/>
			</button>

			<button
				type="button"
				className="context-menu-item unstyled-button"
				onClick={() => {
					if (onUpdateMod) onUpdateMod();
					onClose();
				}}
			>
				Update/Replace
			</button>

			<button
				type="button"
				className="context-menu-item unstyled-button"
				onClick={() => {
					if (onSendToVfxUpdater) onSendToVfxUpdater(mod);
					onClose();
				}}
			>
				Send to VFX Updater
			</button>

			<div className="context-menu-separator" />

			<button
				type="button"
				className="context-menu-item unstyled-button"
				onClick={() => {
					onToggle();
					onClose();
				}}
			>
				{mod.enabled ? "Disable" : "Enable"}
			</button>

			<button
				type="button"
				className="context-menu-item unstyled-button"
				onClick={handleRenameClick}
			>
				Rename
			</button>

			<button
				type="button"
				className={`context-menu-item danger unstyled-button ${isDeleting ? "holding" : ""}`}
				onMouseDown={handleDeleteDown}
				onMouseUp={handleDeleteUp}
				onMouseLeave={handleDeleteUp}
				onKeyDown={handleDeleteKeyDown}
				onKeyUp={handleDeleteKeyUp}
				onBlur={cancelDelete}
			>
				<div className="danger-bg" />
				<span style={{ position: "relative", zIndex: 2 }}>
					{!holdToDelete
						? "Delete"
						: isDeleting
							? "Hold to delete..."
							: "Delete (Hold 2s)"}
				</span>
			</button>

			<div className="context-menu-separator" />

			<button
				type="button"
				className="context-menu-item unstyled-button"
				onClick={() => {
					if (onExtractAssets) onExtractAssets(mod);
					onClose();
				}}
			>
				Extract Assets
			</button>
			<button
				type="button"
				className="context-menu-item unstyled-button"
				onClick={async () => {
					try {
						await invoke("open_in_explorer", { path: mod.path });
					} catch (e) {
						console.error("Failed to open in explorer:", e);
					}
					onClose();
				}}
			>
				Open in Explorer
			</button>
			<button
				type="button"
				className="context-menu-item unstyled-button"
				onClick={async () => {
					try {
						await invoke("copy_to_clipboard", { text: mod.path });
					} catch (e) {
						console.error("Failed to copy path:", e);
					}
					onClose();
				}}
			>
				Copy Path
			</button>
		</div>
	);
};

export default ContextMenu;
