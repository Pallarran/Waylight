import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
// import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
// import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import TripsScreen from './src/screens/TripsScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import AttractionsScreen from './src/screens/AttractionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Icons
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Trips Stack Navigator
function TripsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#F8FAFC',
        },
        headerTintColor: '#0F172A',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="TripsMain" 
        component={TripsScreen}
        options={{
          headerTitle: 'My Trips',
        }}
      />
      <Stack.Screen 
        name="TripDetail" 
        component={TripDetailScreen}
        options={{
          headerShown: false, // We handle the header in the component
        }}
      />
    </Stack.Navigator>
  );
}

// Keep the splash screen visible while we fetch resources
// SplashScreen.preventAutoHideAsync();

export default function App() {
  // const [fontsLoaded] = useFonts({
  //   Inter_400Regular,
  //   Inter_500Medium,
  //   Inter_600SemiBold,
  //   Inter_700Bold,
  //   Manrope_400Regular,
  //   Manrope_500Medium,
  //   Manrope_600SemiBold,
  //   Manrope_700Bold,
  // });

  // useEffect(() => {
  //   if (fontsLoaded) {
  //     SplashScreen.hideAsync();
  //   }
  // }, [fontsLoaded]);

  // if (!fontsLoaded) {
  //   return null;
  // }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Trips') {
                iconName = focused ? 'map' : 'map-outline';
              } else if (route.name === 'Attractions') {
                iconName = focused ? 'star' : 'star-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4ECDC4',
            tabBarInactiveTintColor: '#64748B',
            headerStyle: {
              backgroundColor: '#F8FAFC',
            },
            headerTintColor: '#0F172A',
            headerTitleStyle: {
              fontWeight: '600',
            },
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E2E8F0',
              borderTopWidth: 1,
            },
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              headerTitle: 'Waylight',
            }}
          />
          <Tab.Screen 
            name="Trips" 
            component={TripsStack}
            options={{
              headerShown: false,
            }}
          />
          <Tab.Screen 
            name="Attractions" 
            component={AttractionsScreen}
            options={{
              headerTitle: 'Attractions',
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              headerTitle: 'Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" backgroundColor="#F8FAFC" />
    </SafeAreaProvider>
  );
}