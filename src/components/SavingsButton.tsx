import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SavingsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const SavingsButton = forwardRef<HTMLButtonElement, SavingsButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    const baseStyles = 'font-bold rounded-lg transition-all duration-200 cursor-pointer border-none';
    
    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-[0_4px_0_hsl(var(--primary-dark))] hover:bg-[hsl(var(--primary-dark))] active:translate-y-[2px] active:shadow-[0_2px_0_hsl(var(--primary-darker))]',
      secondary: 'bg-secondary text-secondary-foreground shadow-[0_4px_0_hsl(var(--border))] hover:bg-muted active:translate-y-[2px] active:shadow-[0_2px_0_hsl(var(--border))]',
      danger: 'bg-destructive text-destructive-foreground shadow-[0_4px_0_#b91c1c] hover:bg-[#dc2626] active:translate-y-[2px] active:shadow-[0_2px_0_#991b1b]',
      ghost: 'bg-transparent text-foreground hover:bg-muted'
    };

    const sizes = {
      sm: 'h-9 px-8 text-sm',
      default: 'h-[45px] px-10 text-base',
      lg: 'h-[56px] px-16 text-lg'
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SavingsButton.displayName = 'SavingsButton';

export default SavingsButton;
