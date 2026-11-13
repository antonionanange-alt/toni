import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Page, PageHeader, palette } from '@/components/minex-ui';
import { useAuth } from '@/context/auth-context';
import {
  Equipment,
  Intervention,
  listEquipment,
  listInterventions,
  listMaintenance,
  listTechnicians,
  Maintenance,
  Technician,
} from '@/database/minex-db';

type TableRow = Record<string, string | number | null>;

type LocalTables = {
  equipment: Equipment[];
  technicians: Technician[];
  interventions: Intervention[];
  maintenance: Maintenance[];
};

const EMPTY_TABLES: LocalTables = {
  equipment: [],
  technicians: [],
  interventions: [],
  maintenance: [],
};

export default function DataScreen() {
  const { session } = useAuth();
  const [tables, setTables] = useState<LocalTables>(EMPTY_TABLES);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    Promise.all([listEquipment(), listTechnicians(), listInterventions(), listMaintenance()])
      .then(([equipment, technicians, interventions, maintenance]) => {
        setTables({ equipment, technicians, interventions, maintenance });
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Base locale indisponible', 'Impossible de lire une ou plusieurs tables SQLite.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([listEquipment(), listTechnicians(), listInterventions(), listMaintenance()])
      .then(([equipment, technicians, interventions, maintenance]) => {
        if (active) setTables({ equipment, technicians, interventions, maintenance });
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Base locale indisponible', 'Impossible de lire une ou plusieurs tables SQLite.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!session) return <Redirect href="/" />;

  return (
    <Page>
      <PageHeader
        eyebrow="STOCKAGE LOCAL · SQLITE"
        title="Tables de la base"
        subtitle="Données enregistrées sur ce téléphone, sans serveur distant"
        right={
          <Pressable onPress={refresh} accessibilityRole="button" style={styles.refresh}>
            <Text style={styles.refreshText}>Actualiser</Text>
          </Pressable>
        }
      />
      <Card style={styles.info}>
        <Text style={styles.infoTitle}>minex-maintenance.db</Text>
        <Text style={styles.infoText}>
          Les clés étrangères relient les interventions et les maintenances aux équipements. Supprimer un équipement supprime aussi ses données liées.
        </Text>
      </Card>

      {loading ? <Text style={styles.loading}>Lecture de la base SQLite…</Text> : null}
      {!loading ? (
        <>
          <DataTable
            title="equipements"
            description="Parc réseau et informatique"
            columns={['id', 'nom', 'type', 'localisation', 'adresse_ip', 'date_installation', 'statut']}
            rows={tables.equipment.map(item => ({
              id: item.id,
              nom: item.name,
              type: item.type,
              localisation: item.location,
              adresse_ip: item.ip,
              date_installation: item.installedAt,
              statut: item.status,
            }))}
          />
          <DataTable
            title="techniciens"
            description="Équipe importée ou session courante"
            columns={['id', 'nom', 'specialite', 'telephone']}
            rows={tables.technicians.map(item => ({
              id: item.id,
              nom: item.name,
              specialite: item.specialty,
              telephone: item.phone,
            }))}
          />
          <DataTable
            title="interventions"
            description="Rapports avec médias et coordonnées GPS"
            columns={['id', 'equipement_id', 'date', 'description', 'technicien', 'photo_uri', 'audio_uri', 'latitude', 'longitude']}
            rows={tables.interventions.map(item => ({
              id: item.id,
              equipement_id: item.equipmentId,
              date: item.date,
              description: item.description,
              technicien: item.technician,
              photo_uri: item.photoUri,
              audio_uri: item.audioUri,
              latitude: item.latitude,
              longitude: item.longitude,
            }))}
          />
          <DataTable
            title="maintenance_planifiee"
            description="Tâches et rappels locaux"
            columns={['id', 'equipement_id', 'equipement', 'date', 'type', 'commentaire', 'notification_id']}
            rows={tables.maintenance.map(item => ({
              id: item.id,
              equipement_id: item.equipmentId,
              equipement: item.equipmentName,
              date: item.date,
              type: item.type,
              commentaire: item.comment,
              notification_id: item.notificationId,
            }))}
          />
        </>
      ) : null}
    </Page>
  );
}

function DataTable({
  title,
  description,
  columns,
  rows,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: TableRow[];
}) {
  return (
    <Card style={styles.tableCard}>
      <View style={styles.tableTitleRow}>
        <View style={styles.tableTitleCopy}>
          <Text style={styles.tableName}>{title}</Text>
          <Text style={styles.tableDescription}>{description}</Text>
        </View>
        <Text style={styles.rowCount}>{rows.length} lignes</Text>
      </View>
      <View style={styles.rowCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
          <View>
            <View style={styles.columnHeader}>
              {columns.map(column => (
                <Text key={column} style={styles.columnName}>{column}</Text>
              ))}
            </View>
            {rows.length ? rows.map((row, index) => (
              <View key={`${title}-${String(row.id ?? index)}`} style={styles.dataRow}>
                {columns.map(column => (
                  <Text key={column} selectable style={styles.cell} numberOfLines={3}>
                    {displayValue(row[column])}
                  </Text>
                ))}
              </View>
            )) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Aucune donnée enregistrée dans cette table.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Card>
  );
}

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

const styles = StyleSheet.create({
  refresh: { paddingVertical: 8, paddingHorizontal: 10, backgroundColor: palette.greenLight, borderRadius: 10 },
  refreshText: { color: palette.green, fontWeight: '800', fontSize: 11 },
  info: { backgroundColor: palette.green, borderColor: palette.green },
  infoTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  infoText: { color: '#DCE8E2', fontSize: 12, lineHeight: 18 },
  loading: { color: palette.muted, textAlign: 'center', padding: 18 },
  tableCard: { paddingHorizontal: 13 },
  tableTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tableTitleCopy: { flex: 1, gap: 4 },
  tableName: { color: palette.green, fontSize: 16, fontWeight: '900' },
  tableDescription: { color: palette.muted, fontSize: 11 },
  rowCount: { color: palette.orange, fontSize: 10, fontWeight: '900' },
  rowCard: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, overflow: 'hidden' },
  columnHeader: { flexDirection: 'row', backgroundColor: palette.greenLight },
  columnName: { width: 124, color: palette.green, paddingHorizontal: 9, paddingVertical: 8, fontSize: 10, fontWeight: '900' },
  dataRow: { flexDirection: 'row', backgroundColor: palette.card },
  cell: { width: 124, color: palette.ink, paddingHorizontal: 9, paddingVertical: 9, fontSize: 10, borderTopWidth: 1, borderTopColor: palette.border },
  emptyRow: { padding: 14, borderTopWidth: 1, borderTopColor: palette.border },
  emptyText: { color: palette.muted, fontSize: 11 },
});
