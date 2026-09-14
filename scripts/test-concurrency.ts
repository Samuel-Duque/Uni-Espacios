// scripts/test-concurrency.ts
import axios from 'axios';

async function obtenerTokenValido(baseURL: string): Promise<string> {
  if (process.env.TOKEN) {
    return process.env.TOKEN.startsWith('Bearer ')
      ? process.env.TOKEN
      : `Bearer ${process.env.TOKEN}`;
  }

  try {
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: process.env.TEST_EMAIL || 'docente.ciencias@elpoli.edu.co',
      password: process.env.TEST_PASSWORD || 'Poli2026*!',
    });

    const accessToken = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
    if (accessToken) {
      console.log('🔑 Autenticación exitosa obtenida para la prueba.');
      return `Bearer ${accessToken}`;
    }
  } catch (error: any) {
    console.warn(
      '⚠️ No se pudo autenticar automáticamente vía /api/auth/login. Usando token de fallback.',
    );
  }

  return 'Bearer mock-jwt-token';
}

export async function runConcurrencyTest() {
  const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';
  const URL = `${BASE_URL}/reservas`;
  const TOKEN = await obtenerTokenValido(BASE_URL);

  const payload = {
    espacioId: Number(process.env.TEST_ESPACIO_ID || 1),
    fechaInicio: process.env.TEST_FECHA_INICIO || '2026-10-15T10:00:00.000Z',
    fechaFin: process.env.TEST_FECHA_FIN || '2026-10-15T12:00:00.000Z',
    motivo: 'Prueba de concurrencia anti-solapamiento',
    cantidadAsistentesEstimada: 20,
  };

  console.log('===========================================================');
  console.log('🧪 Iniciando Prueba de Estrés Concurrente Anti Double-Booking');
  console.log(`🎯 Objetivo: ${URL} (Espacio ID: ${payload.espacioId})`);
  console.log(`⏱️ Intervalo: ${payload.fechaInicio} -> ${payload.fechaFin}`);
  console.log('🚀 Lanzando 50 solicitudes concurrentes simultáneas...');
  console.log('===========================================================');

  const promises = Array.from({ length: 50 }).map((_, index) =>
    axios
      .post(URL, payload, { headers: { Authorization: TOKEN } })
      .then((res) => ({ index, status: res.status, data: res.data }))
      .catch((err) => ({
        index,
        status: err.response?.status || 500,
        error: err.response?.data?.message || err.message,
      })),
  );

  const results = await Promise.all(promises);
  const exitosas = results.filter((r) => r.status === 201 || r.status === 200);
  const conflictos = results.filter((r) => r.status === 409);
  const otros = results.filter((r) => r.status !== 201 && r.status !== 200 && r.status !== 409);

  console.log('\n📊 Resultados de la prueba de concurrencia:');
  console.log(`✅ Reservas Aprobadas / Creadas (201/200): ${exitosas.length}`);
  console.log(`🛡️ Conflictos Detectados y Rechazados (409): ${conflictos.length}`);
  if (otros.length > 0) {
    console.log(`⚠️ Otros códigos de respuesta: ${otros.length} (ej. ${otros[0].status}: ${otros[0].error})`);
  }

  if (exitosas.length === 1 && conflictos.length === 49) {
    console.log('\n🎉 ¡TEST EXITOSO! Motor transaccional 100% resistente a double-booking.');
    return true;
  } else {
    console.error('\n❌ FALLÓ LA PRUEBA: Ocurrió una condición de carrera o respuestas inesperadas.');
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    return false;
  }
}

if (require.main === module) {
  runConcurrencyTest();
}
