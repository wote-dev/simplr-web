import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"


interface KeyboardHintProps {
  keys: string[]
  description: string
  label?: string
  className?: string
  variant?: "default" | "secondary" | "outline"
}

export function KeyboardHint({ keys, description, label, className, variant = "outline" }: KeyboardHintProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  const formatKey = (key: string) => {
    if (key.toLowerCase() === 'cmd' || key.toLowerCase() === 'command') {
      return isMac ? '⌘' : 'Ctrl'
    }
    return key.toUpperCase()
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant} 
            className={cn(
              "cursor-help transition-all duration-200 hover:scale-105 flex items-center gap-2 text-xs font-medium",
              className
            )}
          >
            {label && (
              <span className="text-muted-foreground">{label}</span>
            )}
            <div className="flex items-center gap-1">
              {keys.map((key, index) => (
                <React.Fragment key={key}>
                  {index > 0 && <span className="text-muted-foreground">+</span>}
                  <span className="font-semibold">
                    {formatKey(key)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default KeyboardHint