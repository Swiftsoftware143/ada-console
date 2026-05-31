import { cn } from "@/lib/utils"

/**
 * DashboardCard - Reusable card component for ADASwift
 * 
 * Default styling matches the app design:
 * - bg-[#1e2130] background
 * - border-[#2e3245] border
 * - rounded-xl corners
 * - hover effect on border
 */
export function DashboardCard({ 
  children, 
  className, 
  hover = false,
  padding = "normal",
  ...props 
}) {
  const paddingClasses = {
    none: "",
    small: "p-4",
    normal: "p-5",
    large: "p-6",
    xlarge: "p-12"
  }

  return (
    <div
      className={cn(
        "bg-[#1e2130] border border-[#2e3245] rounded-xl",
        paddingClasses[padding],
        hover && "hover:border-[#3e445e] transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * DashboardCardHeader - Header section for DashboardCard
 */
export function DashboardCardHeader({ children, className, ...props }) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)} {...props}>
      {children}
    </div>
  )
}

/**
 * DashboardCardTitle - Title for DashboardCard
 */
export function DashboardCardTitle({ children, className, ...props }) {
  return (
    <h3 
      className={cn("text-lg font-semibold text-white tracking-tight", className)} 
      style={{ fontFamily: "Outfit, sans-serif" }}
      {...props}
    >
      {children}
    </h3>
  )
}

/**
 * DashboardCardContent - Content section for DashboardCard
 */
export function DashboardCardContent({ children, className, ...props }) {
  return (
    <div className={cn("text-[#94a3b8]", className)} {...props}>
      {children}
    </div>
  )
}
