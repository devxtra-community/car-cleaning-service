import { Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className = '',
  ...rest
}: ThemedTextProps & { className?: string }) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  let typeClass = 'text-base font-antigravity-regular';
  if (type === 'title') typeClass = 'text-4xl font-antigravity-bold leading-tight';
  if (type === 'defaultSemiBold') typeClass = 'text-base font-antigravity-semibold';
  if (type === 'subtitle') typeClass = 'text-xl font-antigravity-bold';
  if (type === 'link') typeClass = 'text-base leading-[30px] text-[#0a7ea4]';

  return <Text className={`${typeClass} ${className}`} style={[{ color }, style]} {...rest} />;
}
