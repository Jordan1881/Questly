/**
 * Full-bleed dismiss control for modal/drawer overlays.
 * Uses a real button so keyboard users can activate click-to-dismiss.
 */
export default function DismissBackdrop({
  onClick,
  className = 'absolute inset-0',
  style,
  label = 'Dismiss',
  disabled = false,
  tabIndex,
  'aria-hidden': ariaHidden,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-hidden={ariaHidden}
      tabIndex={tabIndex}
      disabled={disabled}
      onClick={onClick}
      className={`m-0 border-0 p-0 cursor-pointer appearance-none ${className}`.trim()}
      style={{
        background: 'transparent',
        ...style,
      }}
    />
  )
}
