import disneyResortsDining from './disney-resorts-dining.json';
import universalResortsDining from './universal-resorts-dining.json';
import otherHotelsDining from './other-hotels-dining.json';

export const allResortDining = [
  ...disneyResortsDining,
  ...universalResortsDining,
  ...otherHotelsDining
];

export const disneyDining = disneyResortsDining;
export const universalDining = universalResortsDining;
export const otherHotelsDining = otherHotelsDining;

export const getResortDining = (resortId: string) => {
  return allResortDining.filter(dining => dining.resortId === resortId);
};

export const getDiningById = (id: string) => {
  return allResortDining.find(dining => dining.id === id);
};

export const getDiningByType = (type: 'table_service' | 'quick_service' | 'lounge') => {
  return allResortDining.filter(dining => dining.type === type);
};

export const getSignatureDining = () => {
  return allResortDining.filter(dining => dining.features?.signatureDining);
};

export const getCharacterDining = () => {
  return allResortDining.filter(dining => dining.features?.characterDining);
};