import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Path, Line, Polygon, G } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DoodleProps {
  x: number;
  y: number;
  size: number;
  rotation: number;
}



const StarIcon: React.FC<DoodleProps> = ({ x, y, size, rotation }) => {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${size})`}>
      <Polygon
        points="0,-8 2,-2 8,-2 3,1 5,7 0,4 -5,7 -3,1 -8,-2 -2,-2"
        fill="white"
        opacity="0.7"
      />
    </G>
  );
};

const DNAIcon: React.FC<DoodleProps> = ({ x, y, size, rotation }) => {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${size})`}>
      <Path
        d="M-6,-10 Q0,-5 6,0 Q0,5 -6,10"
        fill="none"
        stroke="white"
        strokeWidth="3"
        opacity="0.6"
      />
      <Path
        d="M6,-10 Q0,-5 -6,0 Q0,5 6,10"
        fill="none"
        stroke="white"
        strokeWidth="3"
        opacity="0.6"
      />
      <Line x1="-3" y1="-7" x2="3" y2="-7" stroke="white" strokeWidth="2" opacity="0.4" />
      <Line x1="-2" y1="-3" x2="2" y2="-3" stroke="white" strokeWidth="2" opacity="0.4" />
      <Line x1="-2" y1="3" x2="2" y2="3" stroke="white" strokeWidth="2" opacity="0.4" />
      <Line x1="-3" y1="7" x2="3" y2="7" stroke="white" strokeWidth="2" opacity="0.4" />
    </G>
  );
};

const PiIcon: React.FC<DoodleProps> = ({ x, y, size, rotation }) => {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${size})`}>
      <Line x1="-6" y1="-4" x2="6" y2="-4" stroke="white" strokeWidth="3" opacity="0.7" />
      <Line x1="-3" y1="-4" x2="-3" y2="6" stroke="white" strokeWidth="3" opacity="0.7" />
      <Line x1="3" y1="-4" x2="3" y2="6" stroke="white" strokeWidth="3" opacity="0.7" />
    </G>
  );
};

const DeltaIcon: React.FC<DoodleProps> = ({ x, y, size, rotation }) => {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${size})`}>
      <Polygon
        points="0,-8 -6,6 6,6"
        fill="none"
        stroke="white"
        strokeWidth="3"
        opacity="0.6"
      />
    </G>
  );
};

interface StaticDoodle {
  id: number;
  Component: React.FC<DoodleProps>;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

const generateRandomDoodles = (): StaticDoodle[] => {
  const doodles: StaticDoodle[] = [];
  const icons = [
    StarIcon, PiIcon, DeltaIcon, DNAIcon
  ];
  const numDoodles = Platform.OS === 'web' ? 30 : 60; // Reduce for web performance

  for (let i = 0; i < numDoodles; i++) {
    const IconComponent = icons[Math.floor(Math.random() * icons.length)];
    const x = Math.random() * screenWidth;
    const y = Math.random() * (screenHeight + 200);
    
    doodles.push({
      id: i,
      Component: IconComponent,
      x,
      y,
      size: 0.8 + Math.random() * 1.2,
      rotation: Math.random() * 360,
    });
  }

  return doodles;
};

export const BackgroundDoodles: React.FC = () => {
  const doodles = React.useMemo(() => generateRandomDoodles(), []);

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width={screenWidth}
        height={screenHeight + 200}
        style={styles.svg}
      >
        {doodles.map((doodle) => (
          <doodle.Component
            key={doodle.id}
            x={doodle.x}
            y={doodle.y}
            size={doodle.size}
            rotation={doodle.rotation}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});