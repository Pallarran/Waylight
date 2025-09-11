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
  const options = [
    {
      label: 'Disney Resorts',
      options: disneyResorts.map(hotel => ({
        value: hotel.id,
        label: hotel.name,
        address: hotel.address,
        rooms: hotel.rooms
      }))
    },
    {
      label: 'Universal Resorts', 
      options: universalResorts.map(hotel => ({
        value: hotel.id,
        label: hotel.name,
        address: hotel.address,
        rooms: hotel.rooms
      }))
    },
    {
      label: 'Other Hotels',
      options: otherHotels.map(hotel => ({
        value: hotel.id,
        label: hotel.name,
        address: hotel.address,
        rooms: hotel.rooms
      }))
    }
  ];

  return options;
};