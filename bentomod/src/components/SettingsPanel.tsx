import React, { useState, useEffect } from "react";
import { AnimatedThemeToggler } from "./ui/AnimatedThemeToggler";
import Switch from "./ui/Switch";
import Checkbox from "./ui/Checkbox";
import { LuFolderInput } from "react-icons/lu";
import { RiSparkling2Fill } from "react-icons/ri";
import { CgPerformance } from "react-icons/cg";
import { MdRefresh, MdArticle } from "react-icons/md";
import { FaSteam } from "react-icons/fa";
import { SiEpicgames } from "react-icons/si";
import { RiGraduationCapFill } from "react-icons/ri";
import { BsKeyboardFill } from "react-icons/bs";

import "./SettingsPanel.css";
import { useAlert } from "./AlertHandler";
import { motion } from "framer-motion";

const ACCENT_COLORS = {
	bentoRed: "#be1c1c",
	blue: "#4a9eff",
	purple: "#9c27b0",
	green: "#4CAF50",
	orange: "#ff9800",
	pink: "#FF96BC",
};

type SettingsPayload = {
	hideSuffix: boolean;
	autoOpenDetails: boolean;
	showHeroIcons: boolean;
	showHeroBg: boolean;
	showModType: boolean;
	showExperimental: boolean;
	autoCheckUpdates: boolean;
	parallelProcessing: boolean;

	holdToDelete: boolean;
	showSubfolderMods: boolean;
	bypassGameRunningLock: boolean;
	launcherType: "steam" | "epic";
};

type SettingsPanelProps = {
	settings: Partial<SettingsPayload>;
	onSave: (settings: SettingsPayload) => void;
	onClose: () => void;
	theme: string;
	setTheme: (theme: string) => void;
	accentColor: string;
	setAccentColor: (accent: string) => void;
	gamePath?: string;
	onAutoDetectGamePath: () => void;
	onBrowseGamePath: () => void;
	isGamePathLoading: boolean;
	setParallelProcessing: (enabled: boolean) => void;
	onCheckForUpdates: () => void;
	onViewChangelog: () => void;
	isCheckingUpdates: boolean;
	onReplayTour: () => void;
	onOpenShortcuts: () => void;
};

export default function SettingsPanel({
	settings,
	onSave,
	onClose,
	theme,
	setTheme,
	accentColor,
	setAccentColor,
	gamePath,
	onAutoDetectGamePath,
	onBrowseGamePath,
	isGamePathLoading,
	setParallelProcessing,
	onCheckForUpdates,
	onViewChangelog,
	isCheckingUpdates,
	onReplayTour,
	onOpenShortcuts,
}: SettingsPanelProps) {
	const alert = useAlert();
	const [hideSuffix, setHideSuffix] = useState(settings.hideSuffix || false);
	const [autoOpenDetails, setAutoOpenDetails] = useState(settings.autoOpenDetails || false);
	const [showHeroIcons, setShowHeroIcons] = useState(settings.showHeroIcons || false);
	const [showHeroBg, setShowHeroBg] = useState(settings.showHeroBg || false);
	const [showModType, setShowModType] = useState(settings.showModType || false);
	const [showExperimental, setShowExperimental] = useState(settings.showExperimental || false);
	const [autoCheckUpdates, setAutoCheckUpdates] = useState(settings.autoCheckUpdates || false);
	const [parallelProcessing, setLocalParallelProcessing] = useState(
		settings.parallelProcessing || false,
	);
	const [holdToDelete, setHoldToDelete] = useState(settings.holdToDelete !== false);
	const [showSubfolderMods, setShowSubfolderMods] = useState(
		settings.showSubfolderMods !== false,
	);
	const [bypassGameRunningLock, setBypassGameRunningLock] = useState(
		settings.bypassGameRunningLock || false,
	);

	const [launcherType, setLauncherType] = useState<"steam" | "epic">(
		settings.launcherType || "steam",
	);

	const handleSave = () => {
		onSave({
			hideSuffix,
			autoOpenDetails,
			showHeroIcons,
			showHeroBg,
			showModType,
			showExperimental,
			autoCheckUpdates,
			parallelProcessing,

			holdToDelete,
			showSubfolderMods,
			bypassGameRunningLock,
			launcherType,
		});
		alert.success("Settings Saved", "Your preferences have been updated.");
		onClose();
	};

	useEffect(() => {
		setHoldToDelete(settings.holdToDelete !== false);
	}, [settings.holdToDelete]);

	useEffect(() => {
		setShowSubfolderMods(settings.showSubfolderMods !== false);
	}, [settings.showSubfolderMods]);

	useEffect(() => {
		setBypassGameRunningLock(settings.bypassGameRunningLock || false);
	}, [settings.bypassGameRunningLock]);

	useEffect(() => {
		if (settings.launcherType) {
			setLauncherType(settings.launcherType);
		}
	}, [settings.launcherType]);

	return (
		<div className="modal-overlay" onClick={onClose}>
			<motion.div
				className="modal-content settings-modal"
				onClick={(e) => e.stopPropagation()}
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.15 }}
			>
				<div className="modal-header">
					<h2>Settings</h2>
					<button className="modal-close" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-body">
					<div className="setting-section">
						<h3>Game Mods Path</h3>
						<div className="setting-group">
							<p style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: "0.5rem" }}>
								Your game's mods folder path.
							</p>
							<div className="combined-input-group">
								<input
									type="text"
									value={gamePath || ""}
									readOnly
									placeholder="No game path set"
									className="integrated-input"
								/>
								<div className="input-actions">
									<button
										onClick={onAutoDetectGamePath}
										disabled={isGamePathLoading}
										className="action-btn"
										title="Auto Detect Game Path"
									>
										<RiSparkling2Fill />
										{isGamePathLoading ? "Detecting…" : "Auto Detect"}
									</button>
									<button
										onClick={onBrowseGamePath}
										className="action-btn icon-only"
										title="Browse Folder"
									>
										<LuFolderInput size={16} />
									</button>
								</div>
							</div>
						</div>
					</div>

					<div className="setting-section">
						<h3>BentoMod Updates</h3>
						<div className="setting-group">
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "1rem",
									marginBottom: "1rem",
								}}
							>
								<button
									onClick={onCheckForUpdates}
									disabled={isCheckingUpdates}
									className="action-btn"
									title="Check for updates now"
									style={{ minWidth: "140px" }}
								>
									<MdRefresh className={isCheckingUpdates ? "spin-icon" : ""} />
									{isCheckingUpdates ? "Checking..." : "Check Now"}
								</button>
								<button
									onClick={onViewChangelog}
									className="action-btn"
									title="View changelog"
									style={{ minWidth: "160px" }}
								>
									<MdArticle />
									View Changelog
								</button>
								<span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
									Current Version: v
									{typeof __APP_VERSION__ !== "undefined"
										? __APP_VERSION__
										: "0.0.0"}
								</span>
							</div>

							<Checkbox
								checked={autoCheckUpdates}
								onChange={(checked: boolean) => setAutoCheckUpdates(checked)}
							>
								<span
									style={{
										paddingLeft: "4px",
										fontWeight: "normal",
										opacity: 0.9,
									}}
								>
									Auto-check for updates on startup
								</span>
							</Checkbox>
						</div>
					</div>

					<div className="setting-section">
						<h3>Launcher</h3>
						<div className="setting-group">
							<p style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: "0.5rem" }}>
								Select which launcher to use when clicking "Launch Game".
							</p>

							<div className="segmented-control" style={{ maxWidth: "400px" }}>
								<button
									className={`segment-btn ${launcherType === "steam" ? "active" : ""}`}
									onClick={() => setLauncherType("steam")}
									title="Launch via Steam protocol"
								>
									<FaSteam size={18} /> Steam
								</button>
								<button
									className={`segment-btn ${launcherType === "epic" ? "active" : ""}`}
									onClick={() => setLauncherType("epic")}
									title="Launch via Epic Games executable"
								>
									<SiEpicgames size={16} /> Epic Games
								</button>
							</div>
						</div>
					</div>

					<div className="setting-section">
						<h3>Mods View Settings</h3>
						<div className="setting-group">
							<Checkbox
								checked={hideSuffix}
								onChange={(checked: boolean) => setHideSuffix(checked)}
							>
								<span
									style={{
										paddingLeft: "4px",
										fontWeight: "normal",
										opacity: 0.9,
									}}
								>
									Hide file suffix in mod names
								</span>
							</Checkbox>
							<div>
								<Checkbox
									checked={autoOpenDetails}
									onChange={(checked: boolean) => setAutoOpenDetails(checked)}
								>
									<span
										style={{
											paddingLeft: "4px",
											fontWeight: "normal",
											opacity: 0.9,
										}}
									>
										Auto-open details panel on click
									</span>
								</Checkbox>
							</div>
							<div>
								<Checkbox
									checked={showHeroIcons}
									onChange={(checked: boolean) => setShowHeroIcons(checked)}
								>
									<span
										style={{
											paddingLeft: "4px",
											fontWeight: "normal",
											opacity: 0.9,
										}}
									>
										Show hero icons on mod cards
									</span>
								</Checkbox>
							</div>
							<div>
								<Checkbox
									checked={showHeroBg}
									onChange={(checked: boolean) => setShowHeroBg(checked)}
								>
									<span
										style={{
											paddingLeft: "4px",
											fontWeight: "normal",
											opacity: 0.9,
										}}
									>
										Show hero background on mod cards
									</span>
								</Checkbox>
							</div>
							<div>
								<Checkbox
									checked={showSubfolderMods}
									onChange={(checked: boolean) => setShowSubfolderMods(checked)}
								>
									<span
										style={{
											paddingLeft: "4px",
											fontWeight: "normal",
											opacity: 0.9,
										}}
									>
										Show mods from subfolders
									</span>
								</Checkbox>
								<p
									style={{
										fontSize: "0.9rem",
										opacity: 0.6,
										marginLeft: "28px",
										marginTop: "0.15rem",
									}}
								>
									When enabled, selecting a folder also shows mods in its
									subfolders.
								</p>
							</div>
							<div>
								<Checkbox
									checked={showModType}
									onChange={(checked: boolean) => setShowModType(checked)}
								>
									<span
										style={{
											paddingLeft: "4px",
											fontWeight: "normal",
											opacity: 0.9,
										}}
									>
										Show mod type badge on cards
									</span>
								</Checkbox>
							</div>
							<div>
								<Checkbox
									checked={showExperimental}
									onChange={(checked: boolean) => setShowExperimental(checked)}
								>
									<span
										style={{
											paddingLeft: "4px",
											fontWeight: "normal",
											opacity: 0.9,
										}}
									>
										Enables "Compact List" view
									</span>
								</Checkbox>
							</div>
						</div>
					</div>

					<div className="setting-section">
						<h3>Advanced UI Settings</h3>
						<div className="setting-group">
							<div>
								<Checkbox
									checked={holdToDelete}
									onChange={(checked: boolean) => setHoldToDelete(checked)}
								>
									<span
										style={{
											paddingLeft: "4px",
											fontWeight: "normal",
											opacity: 0.9,
										}}
									>
										Require hold to delete (2s)
									</span>
								</Checkbox>
								<p
									style={{
										fontSize: "0.9rem",
										opacity: 0.6,
										marginLeft: "28px",
										marginTop: "0.15rem",
										color: !holdToDelete ? "#ff5252" : undefined,
									}}
								>
									{!holdToDelete
										? "Deleting mods is irreversible. Mods will be removed instantly on click."
										: "Hold the delete button for 2 seconds to confirm deletion."}
								</p>
							</div>
							<div>
								<Checkbox
									checked={bypassGameRunningLock}
									onChange={(checked: boolean) =>
										setBypassGameRunningLock(checked)
									}
								>
									<span
										style={{
											paddingLeft: "4px",
											fontWeight: "normal",
											opacity: 0.9,
										}}
									>
										Bypass game-running operation lock
									</span>
								</Checkbox>
								<p
									style={{
										fontSize: "0.9rem",
										opacity: 0.6,
										marginLeft: "28px",
										marginTop: "0.15rem",
										color: bypassGameRunningLock ? "#ffb74d" : undefined,
									}}
								>
									{bypassGameRunningLock
										? "Warning: Rename, move, toggle, delete, and priority actions will stay enabled while the game is running."
										: "When disabled, mod operations are blocked while the game is running."}
								</p>
							</div>
						</div>
					</div>

					<div className="setting-section">
						<h3>Experimental</h3>
						<div className="setting-group">
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<div style={{ display: "flex", alignItems: "center" }}>
									<CgPerformance
										style={{ marginRight: "8px", color: accentColor }}
									/>
									<span style={{ fontWeight: "normal", opacity: 0.9 }}>
										Processing Speed
									</span>
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
									<span
										style={{
											fontSize: "0.85rem",
											opacity: parallelProcessing ? 1 : 0.8,
											fontWeight: parallelProcessing ? "700" : "500",
											color: parallelProcessing ? accentColor : "inherit",
											transition: "all 0.2s ease",
										}}
									>
										{parallelProcessing ? "Fast (High CPU)" : "Standard"}
									</span>
									<Switch
										style={{ marginTop: "0.5rem" }}
										checked={parallelProcessing}
										onChange={(checked: boolean) =>
											setLocalParallelProcessing(checked)
										}
									/>
								</div>
							</div>
							<p
								style={{
									fontSize: "0.8rem",
									opacity: 0.6,
									marginLeft: "24px",
									marginTop: "-0.8rem",
									lineHeight: "1.4",
								}}
							>
								Determines how many CPU threads are used to compile and process mods
								({parallelProcessing ? "75%" : "50%"}). This will not affect your
								game performance, as BentoMod only processes files before you launch
								the game.
							</p>
						</div>
					</div>

					<div className="setting-section">
						<h3>Theme</h3>
						<div className="setting-group">
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "1rem",
									marginBottom: "1rem",
								}}
							>
								<AnimatedThemeToggler theme={theme} setTheme={setTheme} />
								<span style={{ fontSize: "0.9rem", opacity: 0.8 }}>
									{theme === "dark" ? "Dark Mode" : "Light Mode"}
								</span>
							</div>

							<label
								style={{
									display: "block",
									marginBottom: "0.5rem",
									fontSize: "0.9rem",
									opacity: 0.9,
								}}
							>
								Accent Color
							</label>
							<div className="color-options">
								{Object.entries(ACCENT_COLORS).map(([name, color]) => (
									<button
										key={name}
										className={`color-option ${accentColor === color ? "selected" : ""}`}
										style={{ backgroundColor: color }}
										onClick={() => setAccentColor(color)}
										title={name.charAt(0).toUpperCase() + name.slice(1)}
									/>
								))}
								<div
									className={`color-option ${!Object.values(ACCENT_COLORS).includes(accentColor) ? "selected" : ""}`}
									style={{ position: "relative", overflow: "hidden" }}
									title="Custom HEX Color"
								>
									<input
										type="color"
										value={
											Object.values(ACCENT_COLORS).includes(accentColor)
												? "#ffffff"
												: accentColor
										}
										onChange={(e) => setAccentColor(e.target.value)}
										style={{
											position: "absolute",
											top: "-10px",
											left: "-10px",
											width: "200%",
											height: "200%",
											cursor: "pointer",
											border: "none",
											padding: 0,
										}}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="setting-section">
						<h3>Help</h3>
						<div className="setting-group">
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<span style={{ fontWeight: "normal", opacity: 0.9 }}>
									Replay the app tour to learn about key features
								</span>
								<button
									onClick={onReplayTour}
									className="action-btn"
									title="Replay the onboarding tour"
									style={{ minWidth: "120px" }}
								>
									<RiGraduationCapFill style={{ color: accentColor }} /> Replay
									Tour
								</button>
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									marginTop: "1rem",
								}}
							>
								<span style={{ fontSize: "1rem", opacity: 0.9 }}>
									Press <strong style={{ opacity: 1 }}>F1</strong> anytime to view
									all available keyboard shortcuts
								</span>
								<button
									onClick={onOpenShortcuts}
									className="action-btn"
									title="View keyboard shortcuts"
									style={{ minWidth: "120px" }}
								>
									<BsKeyboardFill style={{ color: accentColor }} /> Shortcuts
								</button>
							</div>
						</div>
					</div>
				</div>

				<div className="modal-footer">
					<button
						onClick={onClose}
						className="btn-secondary"
						style={{ padding: "0.4rem 1rem", fontSize: "0.9rem", minWidth: "auto" }}
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						className="btn-primary"
						style={{ padding: "0.4rem 1rem", fontSize: "0.9rem", minWidth: "auto" }}
					>
						Save
					</button>
				</div>
			</motion.div>
		</div>
	);
}
