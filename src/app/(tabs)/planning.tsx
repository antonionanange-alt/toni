import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, Card, EmptyState, Field, Page, PageHeader, palette, SectionTitle } from '@/components/minex-ui';
import { addMaintenance, Equipment, listEquipment, listMaintenance, Maintenance } from '@/database/minex-db';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PlanningScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<Maintenance[]>([]);
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [type, setType] = useState('Préventive');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const [assets, plans] = await Promise.all([listEquipment(), listMaintenance()]);
    setEquipment(assets);
    setTasks(plans);
    if (equipmentId === null && assets[0]) setEquipmentId(assets[0].id);
  };

  useEffect(() => {
    let active = true;
    Promise.all([listEquipment(), listMaintenance()])
      .then(([assets, plans]) => {
        if (!active) return;
        setEquipment(assets);
        setTasks(plans);
        setEquipmentId(current => current ?? assets[0]?.id ?? null);
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Planning indisponible', 'Impossible de charger les maintenances.');
      });
    return () => {
      active = false;
    };
  }, []);

  const createTask = async () => {
    if (!equipmentId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Vérifiez le formulaire', 'Choisissez un équipement et saisissez une date au format AAAA-MM-JJ.');
      return;
    }
    const [year, month, day] = date.split('-').map(Number);
    const scheduledDate = new Date(year, month - 1, day, 9, 0, 0);
    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate.getFullYear() !== year ||
      scheduledDate.getMonth() !== month - 1 ||
      scheduledDate.getDate() !== day ||
      scheduledDate <= new Date()
    ) {
      Alert.alert('Date invalide', 'La date de maintenance doit être future.');
      return;
    }

    setLoading(true);
    try {
      let notificationId: string | null = null;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('maintenance', {
          name: 'Rappels de maintenance',
          importance: AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D78638',
        });
      }
      const permission = await Notifications.requestPermissionsAsync();
      if (permission.granted) {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Maintenance MINEX à venir',
            body: `${type} · ${equipment.find(item => item.id === equipmentId)?.name ?? 'Équipement'} — ${comment || 'Intervention planifiée'}`,
            data: { screen: 'planning' },
            ...(Platform.OS === 'android' ? { channelId: 'maintenance' } : {}),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: scheduledDate },
        });
      }

      await addMaintenance({ equipmentId, date, type, comment: comment.trim(), notificationId });
      setDate('');
      setComment('');
      await refresh();
      Alert.alert(
        'Maintenance planifiée',
        notificationId
          ? 'La tâche est enregistrée et une alerte locale est programmée.'
          : 'La tâche est enregistrée. Autorisez les notifications pour recevoir une alerte.'
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Planification impossible', 'La maintenance ou son rappel n’a pas pu être enregistré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="CALENDRIER TECHNIQUE"
        title="Maintenance"
        subtitle="Planifiez les opérations préventives et correctives"
      />

      <Card>
        <SectionTitle>Nouvelle tâche</SectionTitle>
        <Text style={styles.fieldLabel}>Équipement</Text>
        {equipment.length ? (
          <View style={styles.pills}>
            {equipment.map(item => (
              <Pressable
                key={item.id}
                onPress={() => setEquipmentId(item.id)}
                accessibilityRole="button"
                style={[styles.pill, equipmentId === item.id && styles.pillSelected]}>
                <Text style={[styles.pillText, equipmentId === item.id && styles.pillTextSelected]}>{item.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : <Text style={styles.hint}>Ajoutez d’abord un équipement au parc.</Text>}

        <Text style={styles.fieldLabel}>Type d’intervention</Text>
        <View style={styles.pills}>
          {['Préventive', 'Curative'].map(value => (
            <Pressable key={value} onPress={() => setType(value)} style={[styles.pill, type === value && styles.pillSelected]}>
              <Text style={[styles.pillText, type === value && styles.pillTextSelected]}>{value}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Date prévue (AAAA-MM-JJ)" value={date} onChangeText={setDate} placeholder="2026-12-10" />
        <Field label="Commentaire" value={comment} onChangeText={setComment} placeholder="Contrôle alimentation et connectique…" multiline />
        <ActionButton label="Programmer la maintenance" onPress={createTask} loading={loading} disabled={!equipment.length} />
      </Card>

      <SectionTitle>Maintenances planifiées</SectionTitle>
      {!tasks.length ? <EmptyState message="Aucune maintenance planifiée pour le moment." /> : null}
      {tasks.map(task => {
        const isUpcoming = task.date >= new Date().toISOString().slice(0, 10);
        return (
          <Card key={task.id}>
            <View style={styles.taskHeading}>
              <View style={styles.taskCopy}>
                <Text style={styles.taskEquipment}>{task.equipmentName}</Text>
                <Text style={styles.taskDate}>{formatDate(task.date)}</Text>
              </View>
              <View style={[styles.taskTag, isUpcoming ? styles.upcomingTag : styles.pastTag]}>
                <Text style={[styles.taskTagText, isUpcoming ? styles.upcomingText : styles.pastText]}>{task.type}</Text>
              </View>
            </View>
            {task.comment ? <Text style={styles.taskComment}>{task.comment}</Text> : null}
            <Text style={styles.reminder}>{task.notificationId ? '● Alerte locale activée' : '○ Sans alerte locale'}</Text>
          </Card>
        );
      })}
    </Page>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

const styles = StyleSheet.create({
  fieldLabel: { color: palette.ink, fontSize: 13, fontWeight: '700', marginBottom: -3 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: '#FBFCFA' },
  pillSelected: { backgroundColor: palette.green, borderColor: palette.green },
  pillText: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  pillTextSelected: { color: '#FFFFFF' },
  hint: { color: palette.muted, fontSize: 12 },
  taskHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  taskCopy: { flex: 1, gap: 5 },
  taskEquipment: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  taskDate: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  taskTag: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  upcomingTag: { backgroundColor: '#E8F3EC' },
  pastTag: { backgroundColor: '#F0F1EF' },
  taskTagText: { fontSize: 10, fontWeight: '800' },
  upcomingText: { color: palette.success },
  pastText: { color: palette.muted },
  taskComment: { color: palette.ink, fontSize: 12, lineHeight: 18 },
  reminder: { color: palette.muted, fontSize: 10, fontWeight: '700' },
});
