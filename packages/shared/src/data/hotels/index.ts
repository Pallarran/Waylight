import disneyResortsData from './disney-resorts.json';
import universalResortsData from './universal-resorts.json';
import otherHotelsData from './other-hotels.json';

export interface RoomType {
  id: string;
  name: string;
  sleeps: number;
  description?: string;
}

export interface HotelData {
  id: string;
  name: string;
  address: string;
  type: 'disney' | 'universal' | 'other';
  priceLevel: 'value' | 'moderate' | 'deluxe' | 'deluxe_villa';
  description?: string;
  amenities?: string[];
  rooms: RoomType[];
}

export const disneyResorts: HotelData[] = disneyResortsData as HotelData[];
export const universalResorts: HotelData[] = universalResortsData as HotelData[];
export const otherHotels: HotelData[] = otherHotelsData as HotelData[];

export const allHotels: HotelData[] = [
  ...disneyResorts,
  ...universalResorts,
  ...otherHotels,
];

export const getHotelById = (id: string): HotelData | undefined => {
  return allHotels.find(hotel => hotel.id === id);
};

export const getHotelsByType = (type: 'disney' | 'universal' | 'other'): HotelData[] => {
  return allHotels.filter(hotel => hotel.type === type);
};

export const getRoomsForHotel = (hotelId: string): RoomType[] => {
  const hotel = getHotelById(hotelId);
  return hotel ? hotel.rooms : [];
};

export const getHotelOptions = () => {
  // Helper function to create hotel option
  const createHotelOption = (hotel: HotelData) => ({
    value: hotel.id,
    label: hotel.name,
    address: hotel.address,
    rooms: hotel.rooms
  });

  // Helper function to sort hotels alphabetically
  const sortHotelsAlphabetically = (hotels: HotelData[]) =>
    hotels.sort((a, b) => a.name.localeCompare(b.name));

  // Group Disney resorts by price level
  const deluxeAndDeluxeVilla = sortHotelsAlphabetically(
    disneyResorts.filter(hotel => hotel.priceLevel === 'deluxe' || hotel.priceLevel === 'deluxe_villa')
  );
  const moderate = sortHotelsAlphabetically(
    disneyResorts.filter(hotel => hotel.priceLevel === 'moderate')
  );
  const value = sortHotelsAlphabetically(
    disneyResorts.filter(hotel => hotel.priceLevel === 'value')
  );

  const options = [
    {
      label: 'Disney Deluxe & DVC Resorts',
      options: deluxeAndDeluxeVilla.map(createHotelOption)
    },
    {
      label: 'Disney Moderate Resorts',
      options: moderate.map(createHotelOption)
    },
    {
      label: 'Disney Value Resorts',
      options: value.map(createHotelOption)
    },
    {
      label: 'Universal Resorts',
      options: sortHotelsAlphabetically(universalResorts).map(createHotelOption)
    },
    {
      label: 'Other Hotels',
      options: sortHotelsAlphabetically(otherHotels).map(createHotelOption)
    }
  ];

  return options;
};