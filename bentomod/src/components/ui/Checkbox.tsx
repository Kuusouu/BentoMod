import React from "react";
import "./Checkbox.css";

type CheckboxSize = "sm" | "md" | "lg";
type CheckboxColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";
type CheckboxRadius = "circle" | "rounded" | "sm";

type CheckboxProps = Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	"checked" | "color" | "defaultChecked" | "disabled" | "onChange" | "size" | "type"
> & {
	checked?: boolean;
	defaultChecked?: boolean;
	size?: CheckboxSize;
	color?: CheckboxColor;
	isDisabled?: boolean;
	isIndeterminate?: boolean;
	radius?: CheckboxRadius;
	onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
	children?: React.ReactNode;
	className?: string;
};

/**
 * bentomod-style Checkbox component
 *
 * @param {Object} props
 * @param {boolean} [props.checked] - Controlled checked state
 * @param {boolean} [props.defaultChecked=false] - Initial state for uncontrolled usage
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Visual size of the control
 * @param {'default'|'primary'|'secondary'|'success'|'warning'|'danger'} [props.color='primary'] - Accent color
 * @param {boolean} [props.isDisabled=false] - Whether the checkbox is disabled
 * @param {boolean} [props.isIndeterminate=false] - Whether the checkbox is in an indeterminate state
 * @param {'circle'|'rounded'} [props.radius='rounded'] - Shape of the checkbox
 * @param {function} [props.onChange] - Callback receiving (checked:boolean, event:MouseEvent)
 * @param {React.ReactNode} [props.children] - Optional label content rendered to the right
 * @param {string} [props.className] - Optional extra class names
 */
const Checkbox = ({
	checked,
	defaultChecked = false,
	size = "md",
	color = "primary",
	isDisabled = false,
	isIndeterminate = false,
	radius = "rounded",
	onChange,
	children,
	className = "",
	...props
}: CheckboxProps) => {
	const isControlled = typeof checked === "boolean";
	const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
	const currentChecked = isControlled ? checked : internalChecked;
	const inputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		if (isControlled) return;
		setInternalChecked(defaultChecked);
	}, [defaultChecked, isControlled]);

	React.useEffect(() => {
		if (inputRef.current) {
			inputRef.current.indeterminate = isIndeterminate;
		}
	}, [isIndeterminate]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const nextValue = event.currentTarget.checked;
		event.currentTarget.indeterminate = isIndeterminate;
		if (!isControlled) {
			setInternalChecked(nextValue);
		}
		onChange?.(nextValue, event);
	};

	const classes = [
		"bentomod-checkbox",
		size,
		color,
		radius,
		currentChecked ? "checked" : "",
		isDisabled ? "disabled" : "",
		isIndeterminate ? "indeterminate" : "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<label className={classes} data-checked={currentChecked} data-disabled={isDisabled}>
			<input
				{...props}
				ref={inputRef}
				type="checkbox"
				className="bentomod-checkbox-control"
				aria-checked={isIndeterminate ? "mixed" : currentChecked}
				disabled={isDisabled}
				checked={currentChecked}
				onChange={handleChange}
			/>
			<span className="bentomod-checkbox-box" aria-hidden="true">
				{isIndeterminate ? (
					<svg
						aria-hidden="true"
						className="bentomod-checkbox-icon"
						viewBox="0 0 24 24"
						fill="none"
					>
						<line
							x1="5"
							y1="12"
							x2="19"
							y2="12"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
						/>
					</svg>
				) : (
					<svg
						aria-hidden="true"
						className="bentomod-checkbox-icon"
						viewBox="0 0 24 24"
						fill="none"
					>
						<polyline
							points="4 12 9 17 20 6"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
			</span>
			{children && <span className="bentomod-checkbox-label">{children}</span>}
		</label>
	);
};

export { Checkbox };
export default Checkbox;
