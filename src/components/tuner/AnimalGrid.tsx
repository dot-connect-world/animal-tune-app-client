import React from 'react';
import { View, StyleSheet } from 'react-native';
import TunerCat from './TunerCat';
import TunerDog from './TunerDog';
import TunerTurtle from './TunerTurtle';
import TunerHamster from './TunerHamster';

interface AnimalGridProps {
  cents: number | null;
  isActive: boolean;
  tolerance?: number;
}

export default function AnimalGrid({
  cents,
  isActive,
  tolerance = 5,
}: AnimalGridProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TunerCat cents={cents} isActive={isActive} tolerance={tolerance} />
        <TunerDog cents={cents} isActive={isActive} tolerance={tolerance} />
      </View>
      <View style={styles.row}>
        <TunerTurtle cents={cents} isActive={isActive} tolerance={tolerance} />
        <TunerHamster cents={cents} isActive={isActive} tolerance={tolerance} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
