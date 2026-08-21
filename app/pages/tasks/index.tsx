import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { colors } from '../../styles/dashboard.styles';

const PRIORITY_COLOR: Record<string, string> = {
    high: colors.marigold,
    medium: colors.periwinkle,
    low: colors.sage,
};

export default function AllTasksScreen() {
    const insets = useSafeAreaInsets();
    const [tasks, setTasks] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            async function fetchTasks() {
                const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
                if (data) setTasks(data);
            }
            fetchTasks();
        }, [])
    );

    const toggleTask = async (id: string, currentStatus: boolean) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !currentStatus } : t)));
        await supabase.from('tasks').update({ done: !currentStatus }).eq('id', id);
    };

    const confirmDeleteTask = (id: string, title: string) => {
        Alert.alert('Delete Task', `Delete "${title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    setTasks((prev) => prev.filter((t) => t.id !== id));
                    await supabase.from('tasks').delete().eq('id', id);
                },
            },
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
                <Pressable onPress={() => router.back()} hitSlop={10}>
                    <Ionicons name="arrow-back" size={24} color={colors.ink} />
                </Pressable>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, marginLeft: 16 }}>All Tasks</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 100 }}>
                {tasks.map((t) => (
                    <Pressable
                        key={t.id}
                        onPress={() => toggleTask(t.id, t.done)}
                        onLongPress={() => confirmDeleteTask(t.id, t.title)}
                        delayLongPress={400}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#FFFFFF',
                            padding: 16,
                            borderRadius: 16,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: colors.border
                        }}
                    >
                        <View style={[{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#8B96A8', marginRight: 12, alignItems: 'center', justifyContent: 'center' }, t.done && { backgroundColor: '#132A4C', borderColor: '#132A4C' }]}>
                            {t.done && <Ionicons name="checkmark" size={14} color={colors.paper} />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[{ fontSize: 15, fontWeight: '600', color: colors.ink }, t.done && { textDecorationLine: 'line-through', color: '#8B96A8' }]}>{t.title}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PRIORITY_COLOR[t.priority], marginRight: 6 }} />
                                <Text style={{ fontSize: 13, color: '#8B96A8' }}>{t.due}</Text>
                            </View>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
            
            {/* Floating Action Button to add a new task from the Tasks page */}
            <Pressable
                style={{ position: 'absolute', bottom: insets.bottom + 20, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.marigold, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                onPress={() => router.push('/pages/tasks/new' as any)}
            >
                <Ionicons name="add" size={30} color={colors.paper} />
            </Pressable>
        </View>
    );
}
