import { Contact, ContactField, requestPermissionsAsync, type PartialContactDetails } from 'expo-contacts';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { ActionButton, Card, EmptyState, Page, PageHeader, palette, SectionTitle } from '@/components/minex-ui';
import { useAuth } from '@/context/auth-context';
import { addTechnician, deleteTechnician, listTechnicians, Technician } from '@/database/minex-db';

const CONTACT_FIELDS = [ContactField.FULL_NAME, ContactField.PHONES] as const;
type PhoneContact = PartialContactDetails<typeof CONTACT_FIELDS>;

export default function ContactsScreen() {
  const { session } = useAuth();
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTechnicians = async () => setTechnicians(await listTechnicians());

  useEffect(() => {
    let active = true;
    listTechnicians()
      .then(rows => {
        if (active) setTechnicians(rows);
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Contacts MINEX indisponibles', 'Impossible de lire la liste des techniciens.');
      });
    return () => {
      active = false;
    };
  }, []);

  if (!session) return <Redirect href="/" />;

  const importContacts = async () => {
    setLoading(true);
    try {
      const permission = await requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Accès aux contacts refusé', 'Autorisez les contacts pour importer les collègues.');
        return;
      }
      const contacts = await Contact.getAllDetails(CONTACT_FIELDS, { limit: 100 });
      setPhoneContacts(contacts.filter(contact => contact.fullName?.trim()));
    } catch (error) {
      console.error(error);
      Alert.alert('Import impossible', 'Les contacts du téléphone n’ont pas pu être lus.');
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async (contact: PhoneContact) => {
    try {
      const phone = contact.phones?.[0]?.number ?? '';
      const inserted = await addTechnician({
        name: contact.fullName?.trim() || 'Technicien',
        specialty: 'Équipe terrain',
        phone,
      });
      await loadTechnicians();
      Alert.alert(
        inserted ? 'Contact importé' : 'Contact déjà enregistré',
        inserted ? `${contact.fullName} a été ajouté à l’équipe MINEX.` : `${contact.fullName} existe déjà dans la liste.`
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Enregistrement impossible', 'Le contact n’a pas pu être ajouté aux techniciens.');
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="ÉQUIPE MINEX"
        title="Contacts"
        subtitle="Importez les techniciens depuis le carnet d’adresses"
        right={<Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>Retour</Text></Pressable>}
      />
      <Card>
        <SectionTitle>Importer depuis le téléphone</SectionTitle>
        <Text style={styles.info}>
          Les contacts sélectionnés sont copiés dans la base locale des techniciens. Aucun carnet d’adresses n’est envoyé à un serveur.
        </Text>
        <ActionButton label="Lire mes contacts" onPress={importContacts} loading={loading} />
      </Card>

      {phoneContacts.length ? (
        <>
          <SectionTitle>Contacts du téléphone</SectionTitle>
          {phoneContacts.map(contact => (
            <Card key={contact.id} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={styles.name}>{contact.fullName}</Text>
                <Text style={styles.phone}>{contact.phones?.[0]?.number ?? 'Aucun numéro'}</Text>
              </View>
              <Pressable onPress={() => saveContact(contact)} accessibilityRole="button" style={styles.import}>
                <Text style={styles.importText}>Ajouter</Text>
              </Pressable>
            </Card>
          ))}
        </>
      ) : null}

      <View style={styles.section}>
        <SectionTitle>Techniciens enregistrés</SectionTitle>
        {!technicians.length ? <EmptyState message="Importez des collègues pour créer l’équipe terrain." /> : null}
        {technicians.map(item => (
          <Card key={item.id} style={styles.savedCard}>
            <View style={styles.savedInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.specialty}{item.phone ? ` · ${item.phone}` : ''}</Text>
            </View>
            <Pressable
              onPress={() => Alert.alert('Retirer ce technicien ?', item.name, [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Retirer',
                  style: 'destructive',
                  onPress: () => deleteTechnician(item.id)
                    .then(loadTechnicians)
                    .catch(error => {
                      console.error(error);
                      Alert.alert('Suppression impossible', 'Le technicien n’a pas pu être retiré.');
                    }),
                },
              ])}
              accessibilityRole="button">
              <Text style={styles.remove}>Retirer</Text>
            </Pressable>
          </Card>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.green, fontWeight: '800', fontSize: 12, paddingVertical: 8 },
  info: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  contactCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  contactInfo: { flex: 1, gap: 4 },
  name: { color: palette.ink, fontWeight: '800', fontSize: 14 },
  phone: { color: palette.muted, fontSize: 12 },
  import: { backgroundColor: palette.greenLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 },
  importText: { color: palette.green, fontSize: 11, fontWeight: '800' },
  section: { gap: 12 },
  savedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  savedInfo: { flex: 1, gap: 4 },
  remove: { color: palette.danger, fontSize: 11, fontWeight: '800' },
});
