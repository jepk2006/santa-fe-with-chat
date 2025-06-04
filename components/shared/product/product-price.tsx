import { cn } from '@/lib/utils';
import { WeightUnit } from '@/lib/validators';

const ProductPrice = ({
  value,
  className,
  weightUnit,
}: {
  value: number;
  className?: string;
  weightUnit?: WeightUnit | string | null;
}) => {
  // Ensure two decimal places
  const stringValue = value.toFixed(2);
  // Get the int/float
  const [intValue, floatValue] = stringValue.split('.');

  return (
    <div className={cn('flex items-center', className)}>
      <p className="text-2xl">
        <span className='text-xs align-super'>Bs.</span>
        {intValue}
        <span className='text-xs align-super'>.{floatValue}</span>
      </p>
      {weightUnit && (
        <span className="text-xs text-muted-foreground ml-1">
          /{weightUnit}
        </span>
      )}
    </div>
  );
};

export default ProductPrice;
