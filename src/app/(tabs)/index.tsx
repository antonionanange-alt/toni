import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNetworkState } from 'expo-network';

import { ActionButton, Card, MinexLogo, Page, PageHeader, palette, SectionTitle } from '@/components/minex-ui';
import { useAuth } from '@/context/auth-context';
import { getDashboardStats } from '@/database/minex-db';

type Stats = { equipment: number; upcoming: number; interventions: number };

export default function DashboardScreen() {
  const { session, signOut } = useAuth();
  const network = useNetworkState();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(error => {
        console.error(error);
        Alert.alert('Base de données indisponible', 'Impossible de charger le tableau de bord.');
      });
  }, []);

  const connected = network.isConnected === true && network.isInternetReachable !== false;
  const shortcuts = [
    {
      title: 'Équipe technique',
      description: 'Importer les contacts des collègues',
      mark: '01',
      onPress: () => router.push('/contacts'),
    },
    {
      title: 'Diagnostic réseau',
      description: 'Connexion mobile et test serveur',
      mark: '02',
      onPress: () => router.push('/network'),
    },
    {
      title: 'Tables SQLite',
      description: 'Voir les 4 tables et les données locales',
      mark: '03',
      onPress: () => router.push('/(tabs)/data'),
    },
  ];

  return (
    <Page>
      <PageHeader
        eyebrow="MINEX · LUBUMBASHI"
        title={`Bonjour ${session?.name.split(' ')[0] ?? 'Technicien'}`}
        subtitle="Suivi du parc et des opérations terrain"
        right={
          <Pressable onPress={() => {
            signOut()
              .then(() => router.replace('/'))
              .catch(error => {
                console.error(error);
                Alert.alert('Déconnexion impossible', 'La session sécurisée n’a pas pu être supprimée.');
              });
          }} style={styles.logout}>
            <Text style={styles.logoutText}>Quitter</Text>
          </Pressable>
        }
      />

      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <MinexLogo size={60} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>CENTRE DE SUPERVISION MINEX</Text>
            <Text style={styles.heroTitle}>Bienvenue Essentiel</Text>
            <Text style={styles.heroSubtitle}>
              Bonjour {session?.name.split(' ')[0] ?? 'Technicien'}, pilotez vos opérations terrain en un regard.
            </Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <View style={styles.locationPin} />
          <Text style={styles.locationText}>Golf Tshamalalé · avenue Chery Nowej</Text>
        </View>
      </Card>

      <View style={styles.stats}>
        <StatCard label="Équipements" value={stats?.equipment} />
        <StatCard label="Maintenances" value={stats?.upcoming} />
        <StatCard label="Interventions" value={stats?.interventions} />
      </View>

      <Card style={styles.connection}>
        <View style={[styles.statusDot, { backgroundColor: connected ? palette.success : palette.danger }]} />
        <View style={styles.connectionCopy}>
          <Text style={styles.connectionTitle}>{connected ? 'Terminal connecté' : 'Connexion indisponible'}</Text>
          <Text style={styles.connectionText}>
            {network.type ? `${network.type} · ` : ''}{connected ? 'Envoi de rapports possible' : 'Les rapports restent en local'}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/network')} accessibilityRole="button">
          <Text style={styles.link}>Détails</Text>
        </Pressable>
      </Card>

      <View style={styles.sectionHeader}>
        <SectionTitle>Accès rapides</SectionTitle>
        <Text style={styles.staffId}>{session?.matricule}</Text>
      </View>
      <View style={styles.shortcutList}>
        {shortcuts.map(item => (
          <Pressable key={item.title} onPress={item.onPress} accessibilityRole="button">
            <Card style={styles.shortcut}>
              <Text style={styles.shortcutMark}>{item.mark}</Text>
              <View style={styles.shortcutCopy}>
                <Text style={styles.shortcutTitle}>{item.title}</Text>
                <Text style={styles.shortcutDescription}>{item.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <ActionButton
        label="Démarrer une intervention"
        onPress={() => router.push('/(tabs)/intervention')}
      />
      <Text style={styles.footer}>MINEX Terrain · outil de démonstration pour la maintenance interne</Text>
    </Page>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  logout: { paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#E8F0EC', borderRadius: 10 },
  logoutText: { color: palette.green, fontWeight: '800', fontSize: 12 },
  hero: {
    backgroundColor: palette.greenDark,
    borderColor: palette.greenDark,
    padding: 20,
    gap: 19,
    borderRadius: 24,
    shadowColor: palette.greenDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.17,
    shadowRadius: 18,
    elevation: 6,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCopy: { flex: 1, gap: 8 },
  heroEyebrow: { color: palette.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', lineHeight: 25 },
  heroSubtitle: { color: '#D1DFD8', fontSize: 11, lineHeight: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationPin: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.orange },
  locationText: { color: '#DBE5DF', fontSize: 11, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, padding: 13, gap: 4 },
  statValue: { color: palette.green, fontSize: 23, fontWeight: '900' },
  statLabel: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  connection: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  connectionCopy: { flex: 1, gap: 3 },
  connectionTitle: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  connectionText: { color: palette.muted, fontSize: 11 },
  link: { color: palette.green, fontWeight: '800', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  staffId: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  shortcutList: { gap: 9 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 },
  shortcutMark: { color: palette.orange, fontSize: 12, fontWeight: '900' },
  shortcutCopy: { flex: 1, gap: 4 },
  shortcutTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  shortcutDescription: { color: palette.muted, fontSize: 11 },
  arrow: { color: palette.green, fontSize: 24, fontWeight: '400' },
  footer: { color: '#98A49D', fontSize: 10, textAlign: 'center' },
});
