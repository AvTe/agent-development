import { NextResponse } from 'next/server';
import getDb from '@/db/database';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const db = getDb();

    // First, delete related records in `matches` and `emails`
    const matches = db.prepare('SELECT id FROM matches WHERE job_id = ?').all(id);
    const matchIds = matches.map(m => m.id);

    if (matchIds.length > 0) {
      const emailDeleteStmt = db.prepare(`DELETE FROM emails WHERE match_id IN (${matchIds.map(() => '?').join(',')})`);
      emailDeleteStmt.run(...matchIds);
    }
    
    db.prepare('DELETE FROM matches WHERE job_id = ?').run(id);
    
    // Then, delete the job itself
    const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Job delete error:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
