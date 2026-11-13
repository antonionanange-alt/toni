import { CameraView, useCameraPermissions } from 'expo-camera';
import { Directory, File, Paths } from 'expo-file-system';
import * as Location from 'expo-location';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActionButton, Card, Field, Page, PageHeader, palette, SectionTitle } from '@/components/minex-ui';
import { useAuth } from '@/context/auth-context';
import {
  addIntervention,
  Equipment,
  Intervention,
  listEquipment,
  listInterventions,
} from '@/database/minex-db';

type Coordinates = { latitude: number; longitude: number };

export default function InterventionScreen() {
  const { session } = useAuth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
  const recorderState = useAudioRecorderState(recorder);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listEquipment(), listInterventions()])
      .then(([assets, reports]) => {
        if (!active) return;
        setEquipment(assets);
        setInterventions(reports);
        setEquipmentId(current => current ?? assets[0]?.id ?? null);
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Données indisponibles', 'Le parc ou l’historique des interventions n’a pas pu être lu.');
      });
    return () => {
      active = false;
    };
  }, []);

  const loadEquipment = async () => {
    const result = await listEquipment();
    setEquipment(result);
    if (equipmentId === null && result[0]) setEquipmentId(result[0].id);
  };

  const startCamera = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Fonction mobile', 'La capture d’audit est disponible sur Android et iOS.');
      return;
    }
    try {
      const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Accès caméra refusé', 'Autorisez la caméra dans les réglages pour prendre une photo.');
        return;
      }
      if (!equipment.length) await loadEquipment();
      setCameraReady(false);
      setCameraOpen(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Caméra indisponible', 'La permission caméra n’a pas pu être demandée.');
    }
  };

  const takePhoto = async () => {
    if (!camera.current || !cameraReady) return;
    try {
      const result = await camera.current.takePictureAsync({ quality: 0.75 });
      if (!result?.uri) throw new Error('La caméra n’a retourné aucun fichier image.');
      const folder = new Directory(Paths.document, 'minex-audits');
      folder.create({ idempotent: true, intermediates: true });
      const destination = new File(folder, `audit-${Date.now()}.jpg`);
      await new File(result.uri).copy(destination);
      setPhotoUri(destination.uri);
      setCameraOpen(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Photo non enregistrée', 'Impossible de sauvegarder la photo dans le téléphone.');
    }
  };

  const toggleRecording = async () => {
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
        setAudioUri(recorder.uri);
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Accès microphone refusé', 'Autorisez le microphone pour enregistrer une note vocale.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setAudioUri(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Enregistrement audio impossible', 'Vérifiez la permission microphone et réessayez.');
    }
  };

  const locateTechnician = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Accès GPS refusé', 'Autorisez la localisation pour joindre votre position au rapport.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Position indisponible', 'Le GPS n’a pas pu déterminer votre position.');
    }
  };

  const openGoogleMaps = async () => {
    if (!coordinates) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error(error);
      Alert.alert('Carte indisponible', 'Google Maps n’a pas pu être ouvert.');
    }
  };

  const save = async () => {
    if (!equipmentId || !description.trim()) {
      Alert.alert('Rapport incomplet', 'Sélectionnez un équipement et décrivez l’intervention.');
      return;
    }
    if (recorderState.isRecording) {
      Alert.alert('Note vocale en cours', 'Arrêtez l’enregistrement avant de sauvegarder le rapport.');
      return;
    }
    setSaving(true);
    try {
      await addIntervention({
        equipmentId,
        date: new Date().toISOString(),
        description: description.trim(),
        technician: session?.name ?? 'Technicien MINEX',
        photoUri,
        audioUri,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
      });
      setDescription('');
      setPhotoUri(null);
      setAudioUri(null);
      setCoordinates(null);
      Alert.alert('Intervention enregistrée', 'Le rapport et les pièces jointes sont conservés localement.');
      listInterventions()
        .then(setInterventions)
        .catch(error => {
          console.error(error);
          Alert.alert('Historique à actualiser', 'Le rapport est enregistré; la liste des interventions n’a pas pu être rafraîchie.');
        });
    } catch (error) {
      console.error(error);
      Alert.alert('Rapport non enregistré', 'Vérifiez l’équipement et réessayez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="RAPPORT TERRAIN"
        title="Intervention"
        subtitle="Associez un constat, une preuve visuelle et votre position GPS"
      />

      <Card>
        <SectionTitle>Équipement concerné</SectionTitle>
        {equipment.length ? (
          <View style={styles.pills}>
            {equipment.map(item => (
              <Pressable
                key={item.id}
                onPress={() => setEquipmentId(item.id)}
                style={[styles.pill, equipmentId === item.id && styles.pillSelected]}>
                <Text style={[styles.pillText, equipmentId === item.id && styles.pillTextSelected]}>{item.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <ActionButton label="Charger le parc" onPress={() => loadEquipment().catch(error => {
            console.error(error);
            Alert.alert('Parc indisponible', 'Impossible de charger les équipements.');
          })} secondary />
        )}
        <Field
          label="Description du diagnostic"
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez la panne, les contrôles réalisés et les actions prises…"
          multiline
        />
      </Card>

      <Card>
        <SectionTitle>Preuves et localisation</SectionTitle>
        {cameraOpen ? (
          <View style={styles.cameraBox}>
            <CameraView
              ref={camera}
              style={styles.camera}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
            />
            <View style={styles.cameraActions}>
              <ActionButton label="Prendre la photo" onPress={takePhoto} disabled={!cameraReady} />
              <ActionButton label="Annuler" onPress={() => setCameraOpen(false)} secondary />
            </View>
          </View>
        ) : (
          <ActionButton label={photoUri ? 'Reprendre la photo' : 'Prendre une photo d’audit'} onPress={startCamera} secondary />
        )}
        {photoUri ? (
          <View style={styles.attachment}>
            <Image source={{ uri: photoUri }} style={styles.preview} />
            <Text style={styles.attachmentText}>Photo sauvegardée sur cet appareil</Text>
          </View>
        ) : null}
        <ActionButton
          label={recorderState.isRecording ? 'Arrêter et conserver la note vocale' : 'Enregistrer une note vocale'}
          onPress={toggleRecording}
          secondary
        />
        {recorderState.isRecording ? <Text style={styles.recording}>● Enregistrement en cours…</Text> : null}
        {audioUri ? <Text style={styles.attachmentText}>Note vocale sauvegardée localement</Text> : null}
        <ActionButton label={coordinates ? 'Actualiser ma position GPS' : 'Ajouter ma position GPS'} onPress={locateTechnician} secondary />
        {coordinates ? (
          <View style={styles.location}>
            <Text style={styles.coordinates}>{coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}</Text>
            <Pressable onPress={openGoogleMaps} accessibilityRole="button">
              <Text style={styles.mapLink}>Ouvrir dans Google Maps →</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>

      <ActionButton label="Enregistrer le rapport" onPress={save} loading={saving} disabled={!equipment.length} />
      <Pressable onPress={() => router.push('/network')} accessibilityRole="button" style={styles.networkLink}>
        <Text style={styles.networkLinkText}>Vérifier la connexion avant l’envoi →</Text>
      </Pressable>

      <SectionTitle>Historique des interventions</SectionTitle>
      {!interventions.length ? (
        <Text style={styles.emptyHistory}>Les rapports enregistrés apparaîtront ici.</Text>
      ) : null}
      {interventions.map(item => (
        <Card key={item.id}>
          <Text style={styles.historyEquipment}>{item.equipmentName}</Text>
          <Text style={styles.historyDescription}>{item.description}</Text>
          <Text style={styles.historyMeta}>
            {item.technician} · {new Date(item.date).toLocaleString()}
          </Text>
          <Text style={styles.historyMeta}>
            {[
              item.photoUri ? 'Photo' : null,
              item.audioUri ? 'Note vocale' : null,
              item.latitude !== null && item.longitude !== null ? 'GPS' : null,
            ].filter(Boolean).join(' · ') || 'Sans pièce jointe'}
          </Text>
        </Card>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: '#FBFCFA' },
  pillSelected: { backgroundColor: palette.green, borderColor: palette.green },
  pillText: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  pillTextSelected: { color: '#FFFFFF' },
  cameraBox: { gap: 10 },
  camera: { height: 255, width: '100%', borderRadius: 14, overflow: 'hidden' },
  cameraActions: { gap: 8 },
  attachment: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  preview: { width: 58, height: 58, borderRadius: 10, backgroundColor: palette.greenLight },
  attachmentText: { color: palette.success, fontSize: 12, fontWeight: '700' },
  recording: { color: palette.danger, fontSize: 12, fontWeight: '800' },
  location: { padding: 12, borderRadius: 12, backgroundColor: palette.greenLight, gap: 6 },
  coordinates: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  mapLink: { color: palette.green, fontWeight: '800', fontSize: 12 },
  networkLink: { alignItems: 'center', paddingVertical: 4 },
  networkLinkText: { color: palette.green, fontSize: 12, fontWeight: '800' },
  emptyHistory: { color: palette.muted, fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  historyEquipment: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  historyDescription: { color: palette.ink, fontSize: 13, lineHeight: 19 },
  historyMeta: { color: palette.muted, fontSize: 10, fontWeight: '600' },
});
