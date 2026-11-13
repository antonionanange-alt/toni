import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, Card, EmptyState, Field, Page, PageHeader, palette, SectionTitle } from '@/components/minex-ui';
import {
  deleteEquipment,
  Equipment,
  EquipmentInput,
  listEquipment,
  saveEquipment,
} from '@/database/minex-db';

type FormState = Omit<EquipmentInput, 'id'>;
const emptyForm = (): FormState => ({
  name: '',
  type: '',
  location: '',
  ip: '',
  installedAt: new Date().toISOString().slice(0, 10),
  status: 'En service',
});

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setEquipment(await listEquipment());
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    listEquipment()
      .then(items => {
        if (active) setEquipment(items);
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Parc indisponible', 'Impossible de lire les équipements enregistrés.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    if (!form.name.trim() || !form.type.trim() || !form.location.trim()) {
      Alert.alert('Champs requis', 'Saisissez au minimum le nom, le type et la localisation.');
      return;
    }
    try {
      await saveEquipment({
        ...form,
        id: editingId,
        name: form.name.trim(),
        type: form.type.trim(),
        location: form.location.trim(),
        ip: form.ip.trim(),
      });
      setForm(emptyForm());
      setEditingId(undefined);
      setFormVisible(false);
      await refresh();
    } catch (error) {
      console.error(error);
      Alert.alert('Enregistrement impossible', 'Vérifiez les données et le nom de l’équipement.');
    }
  };

  const edit = (item: Equipment) => {
    setForm({
      name: item.name,
      type: item.type,
      location: item.location,
      ip: item.ip,
      installedAt: item.installedAt,
      status: item.status,
    });
    setEditingId(item.id);
    setFormVisible(true);
  };

  const remove = (item: Equipment) => {
    Alert.alert(
      'Retirer cet équipement ?',
      `${item.name} ainsi que ses tâches et interventions liées seront supprimés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteEquipment(item.id)
              .then(refresh)
              .catch(error => {
                console.error(error);
                Alert.alert('Suppression impossible', 'L’équipement n’a pas pu être retiré.');
              });
          },
        },
      ]
    );
  };

  return (
    <Page>
      <PageHeader
        eyebrow="INVENTAIRE"
        title="Parc équipements"
        subtitle="Actifs réseau et informatique de MINEX"
        right={
          <Pressable
            accessibilityRole="button"
            style={styles.addButton}
            onPress={() => {
              setForm(emptyForm());
              setEditingId(undefined);
              setFormVisible(value => !value);
            }}>
            <Text style={styles.addButtonText}>{formVisible ? 'Fermer' : '+ Ajouter'}</Text>
          </Pressable>
        }
      />

      {formVisible ? (
        <Card>
          <SectionTitle>{editingId ? 'Modifier l’équipement' : 'Nouvel équipement'}</SectionTitle>
          <Field label="Nom / référence" value={form.name} onChangeText={name => setForm({ ...form, name })} placeholder="MINEX-R04" />
          <Field label="Type" value={form.type} onChangeText={type => setForm({ ...form, type })} placeholder="Routeur, switch, serveur…" />
          <Field label="Localisation" value={form.location} onChangeText={location => setForm({ ...form, location })} placeholder="Salle réseau, bureau…" />
          <Field label="Adresse IP" value={form.ip} onChangeText={ip => setForm({ ...form, ip })} placeholder="192.168.10.24" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
          <Field label="Date d’installation (AAAA-MM-JJ)" value={form.installedAt} onChangeText={installedAt => setForm({ ...form, installedAt })} placeholder="2025-01-30" />
          <Field label="État" value={form.status} onChangeText={status => setForm({ ...form, status })} placeholder="En service / Hors service" />
          <ActionButton label={editingId ? 'Enregistrer les modifications' : 'Ajouter au parc'} onPress={save} />
        </Card>
      ) : null}

      <View style={styles.listHeader}>
        <SectionTitle>Équipements suivis</SectionTitle>
        <Text style={styles.count}>{equipment.length} actif{equipment.length > 1 ? 's' : ''}</Text>
      </View>
      {loading ? <Text style={styles.message}>Chargement du parc…</Text> : null}
      {!loading && equipment.length === 0 ? <EmptyState message="Aucun équipement enregistré." /> : null}
      {equipment.map(item => (
        <Card key={item.id}>
          <View style={styles.itemHeading}>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemType}>{item.type}</Text>
            </View>
            <View style={[styles.status, item.status.toLowerCase().includes('service') ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, item.status.toLowerCase().includes('service') ? styles.statusActiveText : styles.statusInactiveText]}>
                {item.status}
              </Text>
            </View>
          </View>
          <View style={styles.details}>
            <Detail label="EMPLACEMENT" value={item.location} />
            <Detail label="ADRESSE IP" value={item.ip || 'Non renseignée'} />
          </View>
          <View style={styles.actions}>
            <Pressable onPress={() => edit(item)} accessibilityRole="button"><Text style={styles.edit}>Modifier</Text></Pressable>
            <Pressable onPress={() => remove(item)} accessibilityRole="button"><Text style={styles.delete}>Supprimer</Text></Pressable>
          </View>
        </Card>
      ))}
    </Page>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: { backgroundColor: palette.green, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 11 },
  addButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  message: { color: palette.muted, textAlign: 'center', padding: 18 },
  itemHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemCopy: { gap: 4, flex: 1 },
  itemName: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  itemType: { color: palette.muted, fontSize: 12 },
  status: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusActive: { backgroundColor: '#E8F3EC' },
  statusInactive: { backgroundColor: '#FCEDEA' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusActiveText: { color: palette.success },
  statusInactiveText: { color: palette.danger },
  details: { gap: 10, paddingVertical: 5 },
  detail: { gap: 3 },
  detailLabel: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  detailValue: { color: palette.ink, fontSize: 13, fontWeight: '600' },
  actions: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  edit: { color: palette.green, fontWeight: '800', fontSize: 12 },
  delete: { color: palette.danger, fontWeight: '800', fontSize: 12 },
});
