import { siGoogle, siGithub } from "simple-icons";
import { type SVGProps } from "react";

interface BrandIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function GoogleIcon({ size = 24, className, ...props }: BrandIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={`#${siGoogle.hex}`}
      className={className}
      {...props}
    >
      <title>{siGoogle.title}</title>
      <path d={siGoogle.path} />
    </svg>
  );
}

export function GithubIcon({ size = 24, className, ...props }: BrandIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <title>{siGithub.title}</title>
      <path d={siGithub.path} />
    </svg>
  );
}
