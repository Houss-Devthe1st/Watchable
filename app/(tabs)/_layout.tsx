import { icons } from "@/constants/icons"
import { Tabs } from 'expo-router'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

const TabIcon = ({ focused, icon, title, iconSize = 18 }: any) => {
    if (focused) {
        return (
            <View style={styles.activePill}>
                <Image source={icon} style={[styles.icon, { width: iconSize, height: iconSize }]} tintColor='#fff' />
                <Text style={styles.activeLabel}>{title}</Text>
            </View>
        )
    }
    return (
        <View style={styles.inactiveTab}>
            <Image source={icon} style={[styles.icon, { width: iconSize, height: iconSize }]} tintColor="#A8B5DB" />
            <Text style={styles.inactiveLabel} numberOfLines={1}>{title}</Text>
        </View>
    )
}

const _layout = () => {
    return (
        <Tabs screenOptions={{
            tabBarShowLabel: false,
            tabBarItemStyle: {
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
            },
            tabBarStyle: {
                backgroundColor: "#0f0D23",
                borderRadius: 50,
                marginHorizontal: 20,
                marginBottom: 36,
                height: 40,
                position: "absolute",
                borderTopWidth: 0,
            }
        }}>
            <Tabs.Screen
                name='index'
                options={{
                    headerShown: false,
                    title: 'Home',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.home} title="Home" />
                    )
                }}
            />
            <Tabs.Screen
                name='search'
                options={{
                    headerShown: false,
                    title: 'Search',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.search} title="Search" />
                    )
                }}
            />
            <Tabs.Screen
                name='saved'
                options={{
                    headerShown: false,
                    title: 'Saved',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.save} title="Saved" />
                    )
                }}
            />
            <Tabs.Screen
                name='watched'
                options={{
                    headerShown: false,
                    title: 'Watched',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.play} title="Watched" iconSize={16} />
                    )
                }}
            />
        </Tabs>
    )
}

const styles = StyleSheet.create({
    activePill: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(79, 70, 229, 0.35)',
        minWidth: 72,
        gap: 4,
    },
    inactiveTab: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minWidth: 56,
    },
    icon: {
        resizeMode: 'contain',
    },
    activeLabel: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    inactiveLabel: {
        color: '#A8B5DB',
        fontSize: 9,
        fontWeight: '500',
    },
})

export default _layout
