import GeocoderLayer from './GeocoderLayer';
import TransactionsPerRegion from './TransactionsPerRegion';
// Auto import

export const getLayers = () => {
  return [
    GeocoderLayer(),
    TransactionsPerRegion(),
    // Auto import layers
  ];
};
