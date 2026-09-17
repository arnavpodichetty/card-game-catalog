// Button.tsx — the shared button. Renders an <a> when given href, else a <button>.
import type { ReactNode, MouseEventHandler } from "react";
import { Icon } from "./icons";
import { StyledBtn } from "./button.styles";
import type { BtnKind, BtnSize } from "./button.styles";

export interface BtnProps {
  children: ReactNode;
  kind?: BtnKind;
  size?: BtnSize;
  icon?: string;
  iconRight?: string;
  onClick?: MouseEventHandler;
  href?: string;
  type?: "button" | "submit" | "reset";
  full?: boolean;
  [key: string]: any; // passthrough (disabled, style, aria-*, …)
}

export function Btn({ children, kind = "primary", size = "md", icon, iconRight, onClick, href, type, full, ...rest }: BtnProps) {
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === "lg" ? 22 : 18} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 22 : 18} />}
    </>
  );
  const styleProps = { $kind: kind, $size: size, $full: full };

  if (href !== undefined) {
    return <StyledBtn as="a" {...styleProps} href={href} onClick={onClick} {...rest}>{inner}</StyledBtn>;
  }
  return <StyledBtn {...styleProps} type={type || "button"} onClick={onClick} {...rest}>{inner}</StyledBtn>;
}
