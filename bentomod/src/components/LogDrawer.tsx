import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { BiCopyAlt } from "react-icons/bi";
import { FaTerminal } from "react-icons/fa";
import { VscClearAll } from "react-icons/vsc";
import "./LogDrawer.css";

type CopyFeedback = {
	id: number | "all";
	text: string;
};

type LogDrawerProps = {
	status?: string;
	logs?: string[];
	onClear?: () => void;
	defaultHeight?: number;
	minHeight?: number;
	maxHeightPercent?: number;
	progress?: number;
	isLoading?: boolean;
	isOpen: boolean;
	onToggle: () => void;
};

/**
 * LogDrawer - A terminal-style log drawer component
 *
 * @param {Object} props
 * @param {string} [props.status] - Current status text to display in header
 * @param {string[]} [props.logs] - Array of log messages
 * @param {function} [props.onClear] - Callback when clear button is clicked
 * @param {number} [props.defaultHeight=380] - Default height when expanded
 * @param {number} [props.minHeight=160] - Minimum drawer height
 * @param {number} [props.maxHeightPercent=0.85] - Maximum height as percentage of viewport
 * @param {number} [props.progress=0] - Progress value (0-100), or -1 for indeterminate
 * @param {boolean} [props.isLoading=false] - Whether a long operation is in progress
 */
export default function LogDrawer({
	status = "Idle",
	logs = [],
	onClear,
	defaultHeight = 380,
	minHeight = 160,
	maxHeightPercent = 0.85,
	progress = 0,
	isLoading = false,
	isOpen,
	onToggle,
}: LogDrawerProps) {
	const [drawerHeight, setDrawerHeight] = useState(defaultHeight);
	const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null); // { id: number | 'all', text: string }
	const resizingRef = useRef(false);
	const logScrollRef = useRef<HTMLDivElement | null>(null);

	// Auto-scroll to bottom when new logs arrive
	useEffect(() => {
		if (logScrollRef.current && isOpen) {
			logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
		}
	}, [logs, isOpen]);

	// Handle resize drag
	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (!resizingRef.current) return;
			const y = e.clientY;
			const vh = window.innerHeight;
			const newH = Math.min(Math.max(vh - y, minHeight), Math.round(vh * maxHeightPercent));
			setDrawerHeight(newH);
		};
		const stop = () => {
			resizingRef.current = false;
		};

		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", stop);
		window.addEventListener("mouseleave", stop);

		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", stop);
			window.removeEventListener("mouseleave", stop);
		};
	}, [minHeight, maxHeightPercent]);

	const getLogClass = (log: string) => {
		const lower = log.toLowerCase();
		if (lower.includes("error") || lower.includes("failed")) return "error";
		if (lower.includes("warning") || lower.includes("warn")) return "warning";
		if (lower.includes("success") || lower.includes("complete") || lower.includes("✓"))
			return "success";
		if (lower.includes("info") || lower.includes("installing") || lower.includes("processing"))
			return "info";
		return "";
	};

	const handleCopyLine = async (text: string, index: number) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopyFeedback({ id: index, text: "Copied!" });
			setTimeout(() => setCopyFeedback(null), 1500);
		} catch (err) {
			console.error("Failed to copy to clipboard:", err);
		}
	};

	const handleCopyAll = async () => {
		if (logs.length === 0) return;
		try {
			await navigator.clipboard.writeText(logs.join("\n"));
			setCopyFeedback({ id: "all", text: "All Logs Copied!" });
			setTimeout(() => setCopyFeedback(null), 1500);
		} catch (err) {
			console.error("Failed to copy all logs:", err);
		}
	};

	return (
		<motion.div
			className="log-drawer"
			animate={{ height: isOpen ? drawerHeight : 36 }}
			transition={{ type: "tween", duration: 0.25 }}
		>
			<div className={`log-drawer-header ${isLoading ? "is-loading" : ""}`}>
				{/* Progress bar as background */}
				{isLoading && (
					<div className="log-drawer-progress-bg">
						<div
							className={`log-drawer-progress-bar ${progress < 0 ? "indeterminate" : ""}`}
							style={progress >= 0 ? { width: `${progress}%` } : undefined}
						/>
					</div>
				)}
				<button
					type="button"
					className="log-drawer-status unstyled-button"
					onClick={onToggle}
				>
					<FaTerminal className="log-drawer-icon" />
					<span className="log-drawer-status-text">{status}</span>
					{!isOpen && logs.length > 0 && (
						<span className="log-drawer-count">
							{logs.length} log{logs.length !== 1 ? "s" : ""}
						</span>
					)}
				</button>
				<div className="log-drawer-actions">
					<button type="button" className="log-drawer-btn" onClick={onToggle}>
						{isOpen ? "Hide ▼" : "Show ▲"}
					</button>
				</div>
			</div>

			{isOpen && (
				<hr
					className="log-drawer-resize-handle"
					aria-label="Resize log drawer"
					aria-orientation="horizontal"
					aria-valuemin={minHeight}
					aria-valuemax={Math.round(window.innerHeight * maxHeightPercent)}
					aria-valuenow={drawerHeight}
					tabIndex={0}
					onMouseDown={(e: React.MouseEvent<HTMLHRElement>) => {
						e.stopPropagation();
						resizingRef.current = true;
					}}
					onKeyDown={(e) => {
						if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
						e.preventDefault();
						const direction = e.key === "ArrowUp" ? 1 : -1;
						const maximum = Math.round(window.innerHeight * maxHeightPercent);
						setDrawerHeight((height) =>
							Math.min(Math.max(height + direction * 10, minHeight), maximum),
						);
					}}
					title="Drag to resize"
				/>
			)}

			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						className="log-drawer-body"
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 12 }}
						transition={{ duration: 0.2 }}
					>
						<div className="log-drawer-controls">
							{copyFeedback?.id === "all" && (
								<span className="log-drawer-feedback">{copyFeedback.text}</span>
							)}
							{logs.length > 0 && (
								<>
									<button
										type="button"
										className="log-drawer-action-btn"
										onClick={handleCopyAll}
										title="Copy all logs"
									>
										<BiCopyAlt />
									</button>
									{onClear && (
										<button
											type="button"
											className="log-drawer-action-btn"
											onClick={onClear}
											title="Clear logs"
										>
											<VscClearAll />
										</button>
									)}
								</>
							)}
						</div>

						{logs.length === 0 ? (
							<div className="log-drawer-empty">
								<span className="log-drawer-prompt">$</span>
								<span className="log-drawer-waiting">Waiting for output...</span>
								<span className="log-drawer-cursor" />
							</div>
						) : (
							<div className="log-drawer-scroll" ref={logScrollRef}>
								{logs.map((log, i) => (
									<button
										type="button"
										key={i}
										className={`log-drawer-line unstyled-button ${getLogClass(log)}`}
										onClick={() => handleCopyLine(log, i)}
										onContextMenu={(e) => {
											e.preventDefault();
											handleCopyLine(log, i);
										}}
										title="Copy line"
									>
										<span className="log-drawer-line-number">
											{String(i + 1).padStart(3, " ")}
										</span>
										<span className="log-drawer-line-content">{log}</span>
										{copyFeedback?.id === i && (
											<span className="log-line-feedback">Copied!</span>
										)}
									</button>
								))}
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
