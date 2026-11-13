import * as SQLite from 'expo-sqlite';

export type Equipment = {
  id: number;
  name: string;
  type: string;
  location: string;
  ip: string;
  installedAt: string;
  status: string;
};

export type Maintenance = {
  id: number;
  equipmentId: number;
  equipmentName: string;
  date: string;
  type: string;
  comment: string;
  notificationId: string | null;
};

export type Technician = {
  id: number;
  name: string;
  specialty: string;
  phone: string;
};

export type InterventionInput = {
  equipmentId: number;
  date: string;
  description: string;
  technician: string;
  photoUri: string | null;
  audioUri: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type Intervention = InterventionInput & {
  id: number;
  equipmentName: string;
};

export type EquipmentInput = Omit<Equipment, 'id'> & { id?: number };

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase() {
  const db = await SQLite.openDatabaseAsync('minex-maintenance.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS equipements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      localisation TEXT NOT NULL,
      adresse_ip TEXT NOT NULL DEFAULT '',
      date_installation TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'En service'
    );
    CREATE TABLE IF NOT EXISTS techniciens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      specialite TEXT NOT NULL,
      telephone TEXT NOT NULL DEFAULT '',
      UNIQUE(nom, telephone)
    );
    CREATE TABLE IF NOT EXISTS interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipement_id INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      technicien TEXT NOT NULL,
      photo_uri TEXT,
      audio_uri TEXT,
      latitude REAL,
      longitude REAL
    );
    CREATE TABLE IF NOT EXISTS maintenance_planifiee (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipement_id INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      commentaire TEXT NOT NULL DEFAULT '',
      notification_id TEXT
    );
  `);

  const equipmentColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(equipements)');
  if (!equipmentColumns.some(column => column.name === 'adresse_ip')) {
    await db.execAsync("ALTER TABLE equipements ADD COLUMN adresse_ip TEXT NOT NULL DEFAULT ''");
  }
  if (equipmentColumns.some(column => column.name === 'ip')) {
    await db.runAsync("UPDATE equipements SET adresse_ip = ip WHERE adresse_ip = ''");
  }

  const existing = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM equipements'
  );
  if (!existing?.total) {
    await db.runAsync(
      `INSERT INTO equipements (nom, type, localisation, adresse_ip, date_installation) VALUES
        (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      'MINEX-R01',
      'Routeur',
      'Salle réseau — Golf Tshamalalé',
      '192.168.10.1',
      '2024-02-15',
      'MINEX-SW02',
      'Switch',
      'Bureau technique — avenue Chery Nowej',
      '192.168.10.12',
      '2023-08-03',
      'MINEX-SRV01',
      'Serveur',
      'Local technique — Lubumbashi',
      '192.168.10.20',
      '2022-11-20'
    );
  }
  return db;
}

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabase().catch(error => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function listEquipment() {
  const db = await getDatabase();
  return db.getAllAsync<Equipment>(
    `SELECT id, nom AS name, type, localisation AS location, adresse_ip AS ip,
      date_installation AS installedAt, statut AS status
     FROM equipements ORDER BY nom`
  );
}

export async function saveEquipment(item: EquipmentInput) {
  const db = await getDatabase();
  if (item.id) {
    await db.runAsync(
      `UPDATE equipements SET nom = ?, type = ?, localisation = ?, adresse_ip = ?,
       date_installation = ?, statut = ? WHERE id = ?`,
      item.name,
      item.type,
      item.location,
      item.ip,
      item.installedAt,
      item.status,
      item.id
    );
    return item.id;
  }
  const result = await db.runAsync(
    `INSERT INTO equipements (nom, type, localisation, adresse_ip, date_installation, statut)
     VALUES (?, ?, ?, ?, ?, ?)`,
    item.name,
    item.type,
    item.location,
    item.ip,
    item.installedAt,
    item.status
  );
  return result.lastInsertRowId;
}

export async function deleteEquipment(id: number) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM equipements WHERE id = ?', id);
}

export async function listMaintenance() {
  const db = await getDatabase();
  return db.getAllAsync<Maintenance>(
    `SELECT m.id, m.equipement_id AS equipmentId, e.nom AS equipmentName,
      m.date, m.type, m.commentaire AS comment, m.notification_id AS notificationId
     FROM maintenance_planifiee m
     JOIN equipements e ON e.id = m.equipement_id
     ORDER BY m.date`
  );
}

export async function addMaintenance(item: Omit<Maintenance, 'id' | 'equipmentName'>) {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO maintenance_planifiee (equipement_id, date, type, commentaire, notification_id)
     VALUES (?, ?, ?, ?, ?)`,
    item.equipmentId,
    item.date,
    item.type,
    item.comment,
    item.notificationId
  );
  return result.lastInsertRowId;
}

export async function listTechnicians() {
  const db = await getDatabase();
  return db.getAllAsync<Technician>(
    `SELECT id, nom AS name, specialite AS specialty, telephone AS phone
     FROM techniciens ORDER BY nom`
  );
}

export async function addTechnician(item: Omit<Technician, 'id'>) {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO techniciens (nom, specialite, telephone) VALUES (?, ?, ?)`,
    item.name,
    item.specialty,
    item.phone
  );
  return result.changes > 0;
}

export async function deleteTechnician(id: number) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM techniciens WHERE id = ?', id);
}

export async function addIntervention(item: InterventionInput) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO interventions
      (equipement_id, date, description, technicien, photo_uri, audio_uri, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    item.equipmentId,
    item.date,
    item.description,
    item.technician,
    item.photoUri,
    item.audioUri,
    item.latitude,
    item.longitude
  );
}

export async function listInterventions() {
  const db = await getDatabase();
  return db.getAllAsync<Intervention>(
    `SELECT i.id, i.equipement_id AS equipmentId, e.nom AS equipmentName,
      i.date, i.description, i.technicien AS technician, i.photo_uri AS photoUri,
      i.audio_uri AS audioUri, i.latitude, i.longitude
     FROM interventions i
     JOIN equipements e ON e.id = i.equipement_id
     ORDER BY i.date DESC`
  );
}

export async function getDashboardStats() {
  const db = await getDatabase();
  const [equipment, upcoming, interventions] = await Promise.all([
    db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM equipements'),
    db.getFirstAsync<{ total: number }>(
      "SELECT COUNT(*) AS total FROM maintenance_planifiee WHERE date >= date('now', 'localtime')"
    ),
    db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM interventions'),
  ]);
  return {
    equipment: equipment?.total ?? 0,
    upcoming: upcoming?.total ?? 0,
    interventions: interventions?.total ?? 0,
  };
}
