import { dbRun } from './src/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database with demo data...');

  // Create demo user
  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash('demo123', 10);

  await dbRun(
    'INSERT INTO users (id, email, password_hash, company_name, rbq_number, usage_preference, team_size, sector) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, 'demo@monflux.app', hashedPassword, 'Construction DEMO Inc.', 'RBQ123456', 'chat', '5-20 personnes', 'Rénovation']
  );

  // Create sample projects
  const projectIds = [];
  for (let i = 0; i < 3; i++) {
    const projectId = uuidv4();
    projectIds.push(projectId);
    
    await dbRun(
      'INSERT INTO projects (id, user_id, name, type, status, budget, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, DATE("now"), DATE("now", "+30 days"))',
      [projectId, userId, `Projet Sample ${i + 1}`, ['Rénovation', 'Électrique', 'Plomberie'][i % 3], 'active', 5000 + i * 2000]
    );

    // Add team members
    for (let j = 0; j < 2; j++) {
      const memberId = uuidv4();
      await dbRun(
        'INSERT INTO team_members (id, project_id, user_id, name, email, role) VALUES (?, ?, ?, ?, ?, ?)',
        [memberId, projectId, userId, `Team Member ${j + 1}`, `member${j}@demo.app`, j === 0 ? 'admin' : 'worker']
      );
    }

    // Add sample chat messages
    const chatId = uuidv4();
    await dbRun(
      'INSERT INTO chat_messages (id, project_id, user_id, message, response, persona) VALUES (?, ?, ?, ?, ?, ?)',
      [chatId, projectId, userId, 'Quel est le timing pour ce projet?', 'Basé sur votre budget et type, ce projet devrait prendre environ 30 jours de travail.', 'general']
    );
  }

  // Add sample contacts
  for (let i = 0; i < 5; i++) {
    const contactId = uuidv4();
    await dbRun(
      'INSERT INTO contacts (id, user_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [contactId, userId, `Fournisseur ${i + 1}`, `fournisseur${i}@demo.app`, `514-555-${1000 + i}`, `Montreal, QC`]
    );
  }

  console.log('✅ Demo data seeded successfully!');
  console.log('📧 Demo user: demo@monflux.app');
  console.log('🔑 Password: demo123');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
