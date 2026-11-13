import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View, StyleSheet } from 'react-native';

import { ActionButton, Card, Field, MinexLogo, palette } from '@/components/minex-ui';
import { useAuth } from '@/context/auth-context';
import { addTechnician } from '@/database/minex-db';

export default function LoginScreen() {
  const { session, signIn } = useAuth();
  const [name, setName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) router.replace('/(tabs)');
  }, [session]);

  const connect = async () => {
    if (!name.trim() || !matricule.trim()) {
      Alert.alert('Informations requises', 'Saisissez votre nom et votre matricule de technicien.');
      return;
    }
    setSubmitting(true);
    try {
      await addTechnician({ name: name.trim(), specialty: 'Réseau', phone: '' });
      await signIn(name, matricule);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Connexion impossible', 'La session sécurisée n’a pas pu être enregistrée.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.page}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <MinexLogo size={76} />
          <Text style={styles.company}>MINEX</Text>
          <Text style={styles.location}>LUBUMBASHI · MAINTENANCE & RÉSEAU</Text>
        </View>

        <Card style={styles.form}>
          <View style={styles.welcome}>
            <Text style={styles.title}>Bienvenue chez MINEX</Text>
            <Text style={styles.subtitle}>
              Connectez-vous à votre espace technicien pour gérer les équipements et les interventions terrain.
            </Text>
          </View>
          <Field
            label="Nom complet"
            value={name}
            onChangeText={setName}
            placeholder="Ex. Jean Mutombo"
            autoCapitalize="words"
            autoComplete="name"
          />
          <Field
            label="Matricule"
            value={matricule}
            onChangeText={setMatricule}
            placeholder="Ex. MIN-024"
            autoCapitalize="characters"
          />
          <ActionButton label="Ouvrir ma session" onPress={connect} loading={submitting} />
          <Text style={styles.notice}>
            Démonstration locale : utilisez votre nom et un matricule de test. La session est
            conservée dans le stockage sécurisé du téléphone.
          </Text>
        </Card>
        <Text style={styles.address}>Golf Tshamalalé · avenue Chery Nowej</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, justifyContent: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 18 },
  brand: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 21,
    borderRadius: 24,
    backgroundColor: palette.greenDark,
    borderWidth: 1,
    borderColor: '#1C4A41',
  },
  company: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  location: { color: '#D1DFD8', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  form: { padding: 22, gap: 17 },
  welcome: { gap: 5, marginBottom: 2 },
  title: { color: palette.ink, fontSize: 22, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  notice: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  address: { textAlign: 'center', color: palette.muted, fontSize: 12, fontWeight: '700' },
});
