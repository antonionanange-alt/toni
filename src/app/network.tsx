import { useNetworkState } from 'expo-network';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { ActionButton, Card, Page, PageHeader, palette, SectionTitle } from '@/components/minex-ui';
import { useAuth } from '@/context/auth-context';

type ApiResult = { ip: string };

export default function NetworkScreen() {
  const { session } = useAuth();
  const network = useNetworkState();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const connected = network.isConnected === true && network.isInternetReachable !== false;

  const diagnose = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      if (!response.ok) throw new Error(`Le serveur a répondu avec le statut ${response.status}.`);
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('ip' in data) || typeof data.ip !== 'string') {
        throw new Error('La réponse du serveur n’a pas le format JSON attendu.');
      }
      setResult({ ip: data.ip });
    } catch (error) {
      console.error(error);
      Alert.alert('Diagnostic serveur échoué', 'Vérifiez la connexion Internet puis relancez le test.');
    } finally {
      setLoading(false);
    }
  };

  const networkType = String(network.type ?? 'Inconnu');
  const internetStatus = network.isInternetReachable === null || network.isInternetReachable === undefined
    ? 'Vérification en cours'
    : network.isInternetReachable
      ? 'Internet accessible'
      : 'Internet inaccessible';

  if (!session) return <Redirect href="/" />;

  return (
    <Page>
      <PageHeader
        eyebrow="SUPERVISION"
        title="Diagnostic réseau"
        subtitle="État de la connexion mobile et disponibilité du serveur"
        right={<Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>Retour</Text></Pressable>}
      />

      <Card style={styles.statusCard}>
        <View style={styles.statusHead}>
          <View style={[styles.dot, { backgroundColor: connected ? palette.success : palette.danger }]} />
          <Text style={styles.statusTitle}>{connected ? 'Terminal connecté' : 'Terminal hors connexion'}</Text>
        </View>
        <NetworkRow label="Type de réseau" value={networkType} />
        <NetworkRow label="État internet" value={internetStatus} />
        <NetworkRow label="Connexion locale" value={network.isConnected ? 'Connecté' : 'Déconnecté'} />
        <View style={styles.note}>
          <Text style={styles.noteText}>
            La puissance radio (RSSI) n’est pas exposée par expo-network sur ce terminal; aucune valeur de signal n’est simulée.
          </Text>
        </View>
      </Card>

      <Card>
        <SectionTitle>Diagnostic serveur public</SectionTitle>
        <Text style={styles.description}>
          Requête HTTPS vers api.ipify.org pour confirmer la sortie Internet et afficher l’IP publique.
        </Text>
        <ActionButton label="Tester le serveur" onPress={diagnose} loading={loading} />
        {result ? (
          <View style={styles.jsonBox}>
            <Text style={styles.jsonLabel}>RÉPONSE JSON</Text>
            <Text selectable style={styles.json}>{JSON.stringify(result, null, 2)}</Text>
          </View>
        ) : null}
      </Card>

      <Text style={styles.disclaimer}>
        Le diagnostic vérifie l’accès Internet public. Pour vérifier le réseau privé MINEX, remplacez l’URL par celle de l’API de l’entreprise.
      </Text>
    </Page>
  );
}

function NetworkRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.green, fontWeight: '800', fontSize: 12, paddingVertical: 8 },
  statusCard: { gap: 15 },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 4 },
  dot: { height: 10, width: 10, borderRadius: 5 },
  statusTitle: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rowLabel: { color: palette.muted, fontSize: 12 },
  rowValue: { color: palette.ink, fontSize: 12, fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  note: { padding: 11, borderRadius: 10, backgroundColor: '#F5F6F2' },
  noteText: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  description: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  jsonBox: { backgroundColor: '#172522', borderRadius: 12, padding: 13, gap: 7 },
  jsonLabel: { color: '#D9A96E', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  json: { color: '#E8F0EC', fontSize: 13, fontFamily: 'monospace' },
  disclaimer: { color: palette.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
