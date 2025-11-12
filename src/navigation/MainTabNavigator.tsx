import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "./types";
import HomeScreen from "@/screens/home";
import MoreScreen from "@/screens/MoreScreen";
import CustomTabBar from "@/navigation/components/CustomTabBar.tsx";
import {NotesListScreen} from "@/screens/alarmNote/NotesList/NotesListScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="NOTES"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // tabBarStyle: {
        //   height: 60,
        // },
        // tabBarHideOnKeyboard: true,
        // tabBarShowLabel: false,
        // tabBarActiveTintColor: 'red',
        // tabBarInactiveTintColor: 'blue',
        // tabBarLabelStyle: {
        //   fontSize: 12,
        //   fontWeight: 'bold',
        // },
        // tabBarIconStyle: {
        //   width: 24,
        //   height: 24,
        // },
        // tabBarAccessibilityLabel: 'Home',
      }}
    >
      <Tab.Screen
        name="HOME"
        component={HomeScreen}
        options={{
          title: "HOME",
        }}
      />
      <Tab.Screen
        name="NOTES"
        component={NotesListScreen}
        options={{
          title: "NOTES",
        }}
      />
      <Tab.Screen
        name="MORE"
        component={MoreScreen}
        options={{
          title: "MORE",
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
