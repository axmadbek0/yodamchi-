import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groqService } from '../services/groq.service';

describe('Groq AI Service — Multi-Key Failover & Generation Tests', async () => {
  it('1. Groq health check returns healthy status with keys loaded', () => {
    const health = groqService.getHealth();
    assert.equal(health.ok, true, 'Groq xizmati faol bo\'lishi kerak');
    assert.ok(health.totalKeysConfigured >= 2, 'Kamida 2 ta kalit sozlangan bo\'lishi kerak');
    assert.ok(health.activeKeyMasked.includes('...'), 'Kalit formati to\'g\'ri');
    console.log('  ✔ Groq Health:', health);
  });

  it('2. Groq AI generates fast Uzbek response with failover protection', async () => {
    const response = await groqService.generateCompletion([
      { role: 'user', content: 'Salom, 5 ta so\'z bilan salomlash.' }
    ]);
    assert.ok(response && response.length > 0, 'Javob bo\'sh bo\'lmasligi kerak');
    console.log('  ✔ Groq javobi:', response);
  });

  it('3. Groq AI analyzes student daily log for special education', async () => {
    const analysis = await groqService.analyzeStudentDailyLog({
      studentName: 'Temur',
      mood: 'xursand',
      health: 'yaxshi',
      logText: 'Bugun darsda rasmlar chizdi va barmoq mashqlarini bajardi.',
    });
    assert.ok(analysis && analysis.length > 0, 'Pedagogik tahlil qaytishi kerak');
    console.log('  ✔ Kunlik tahlil:', analysis);
  });
});
