import { cssInterop } from 'react-native-css-interop';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Checkbox from 'expo-checkbox';

// Register third-party components so they accept className prop
cssInterop(LinearGradient, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(BlurView, { className: 'style' });
cssInterop(Checkbox, { className: 'style' });
cssInterop(Svg, { className: 'style' });
cssInterop(Path, { className: 'style' });
cssInterop(Circle, { className: 'style' });
cssInterop(Defs, { className: 'style' });
cssInterop(Stop, { className: 'style' });
