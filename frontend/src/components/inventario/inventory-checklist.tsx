'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Trophy,
  Armchair,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Loader2,
  FileCheck,
  Info,
} from 'lucide-react';
import {
  EstadoItemVerificacion,
  DetalleVerificacionItemInput,
} from '../../schemas/verificacion.schema';
import { CategoriaItem } from '../../schemas/inventario.schema';

export interface InventarioItemParaVerificar {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaItem;
  cantidad: number;
  esCritico: boolean;
  descripcion?: string | null;
}

interface InventoryChecklistProps {
  items: InventarioItemParaVerificar[];
  tipo: 'CHECK_IN' | 'CHECK_OUT';
  reservaId: number;
  espacioNombre: string;
  isSubmitting?: boolean;
  onSubmit: (data: {
    observacionesGenerales?: string;
    items: DetalleVerificacionItemInput[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function InventoryChecklist({
  items,
  tipo,
  reservaId,
  espacioNombre,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: InventoryChecklistProps) {
  // Inicializar estado de verificación para cada ítem
  const [itemStates, setItemStates] = useState<
    Record<
      number,
      {
        estadoItem: EstadoItemVerificacion;
        cantidadEncontrada: number;
        observacionNovedad: string;
      }
    >
  >(() => {
    const initial: Record<number, any> = {};
    items.forEach((item) => {
      initial[item.id] = {
        estadoItem: 'PRESENTE_OPTIMO',
        cantidadEncontrada: item.cantidad,
        observacionNovedad: '',
      };
    });
    return initial;
  });

  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Actualizar estado de un ítem
  const handleEstadoChange = (itemId: number, estado: EstadoItemVerificacion) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        estadoItem: estado,
      },
    }));
  };

  const handleCantidadChange = (itemId: number, cantidad: number) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        cantidadEncontrada: Math.max(0, cantidad),
      },
    }));
  };

  const handleObservacionChange = (itemId: number, observacion: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        observacionNovedad: observacion,
      },
    }));
  };

  // Resumen de conteos
  const totalItems = items.length;
  const optimosCount = Object.values(itemStates).filter(
    (s) => s.estadoItem === 'PRESENTE_OPTIMO',
  ).length;
  const danadosCount = Object.values(itemStates).filter(
    (s) => s.estadoItem === 'PRESENTE_DANADO',
  ).length;
  const faltantesCount = Object.values(itemStates).filter(
    (s) => s.estadoItem === 'FALTANTE',
  ).length;
  const hayNovedades = danadosCount > 0 || faltantesCount > 0;

  // Renderizar icono por categoría
  const getCategoryIcon = (categoria: CategoriaItem) => {
    switch (categoria) {
      case 'TECNOLOGIA':
        return <Laptop className="h-4 w-4 text-sky-600" />;
      case 'DEPORTIVO':
        return <Trophy className="h-4 w-4 text-amber-600" />;
      case 'MOBILIARIO':
        return <Armchair className="h-4 w-4 text-emerald-600" />;
      case 'DIDACTICO':
        return <BookOpen className="h-4 w-4 text-indigo-600" />;
      default:
        return <Info className="h-4 w-4 text-slate-600" />;
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validar que si hay daño o faltante, se haya redactado una observación mínima
    for (const item of items) {
      const state = itemStates[item.id];
      if (
        (state.estadoItem === 'PRESENTE_DANADO' || state.estadoItem === 'FALTANTE') &&
        (!state.observacionNovedad || state.observacionNovedad.trim().length < 4)
      ) {
        setValidationError(
          `Debe especificar el detalle de la novedad para el implemento "${item.nombre}" (${state.estadoItem === 'PRESENTE_DANADO' ? 'Dañado' : 'Faltante'}).`,
        );
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    const payload: {
      observacionesGenerales?: string;
      items: DetalleVerificacionItemInput[];
    } = {
      observacionesGenerales: observacionesGenerales.trim() || undefined,
      items: items.map((item) => ({
        itemInventarioId: item.id,
        estadoItem: itemStates[item.id].estadoItem,
        cantidadEncontrada: itemStates[item.id].cantidadEncontrada,
        observacionNovedad: itemStates[item.id].observacionNovedad?.trim() || undefined,
      })),
    };

    await onSubmit(payload);
    setShowConfirmModal(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header del acta */}
      <div
        className={`px-6 py-5 border-b ${
          tipo === 'CHECK_IN'
            ? 'bg-gradient-to-r from-emerald-800 to-teal-900 text-white'
            : 'bg-gradient-to-r from-slate-900 to-emerald-950 text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-white/20">
                {tipo === 'CHECK_IN' ? 'Acta de Entrega (Check-In)' : 'Acta de Devolución (Check-Out)'}
              </span>
              <span className="text-xs text-white/80 font-mono">Reserva #{reservaId}</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">{espacioNombre}</h2>
          </div>
          <div className="text-right text-xs text-emerald-100">
            <span>{totalItems} implemento(s) en inventario</span>
          </div>
        </div>
      </div>

      {/* Banner explicativo según tipo */}
      <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex items-start space-x-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          {tipo === 'CHECK_IN' ? (
            <p>
              <strong>Lista de Chequeo Inicial:</strong> Valida que cada implemento se encuentre en el espacio y en estado operativo antes de iniciar tu actividad. Si encuentras implementos dañados o ausentes, documéntalo aquí para no ser responsabilizado al finalizar.
            </p>
          ) : (
            <p>
              <strong>Inspección de Cierre:</strong> Verifica el estado final de los implementos antes de entregar el espacio. Recuerda que la pérdida o daño no reportado en Check-In incurrirá en inhabilitación preventiva.
            </p>
          )}
        </div>
      </div>

      {/* Mensaje de Error de Validación */}
      {validationError && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Formulario de Chequeo */}
      <form onSubmit={handlePreSubmit} className="p-6 space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Este espacio no tiene implementos de inventario asignados actualmente. Puedes confirmar la verificación directamente.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              const state = itemStates[item.id] || {
                estadoItem: 'PRESENTE_OPTIMO',
                cantidadEncontrada: item.cantidad,
                observacionNovedad: '',
              };
              const isIssue = state.estadoItem !== 'PRESENTE_OPTIMO';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isIssue
                      ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Información del Ítem */}
                    <div className="flex items-start space-x-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-slate-900 text-sm">{item.nombre}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                            {item.codigo}
                          </span>
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-600">
                            {getCategoryIcon(item.categoria)}
                            <span>{item.categoria}</span>
                          </span>
                          {item.esCritico && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Crítico
                            </span>
                          )}
                        </div>
                        {item.descripcion && (
                          <p className="text-xs text-slate-500 mt-1">{item.descripcion}</p>
                        )}
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Cantidad esperada: <strong>{item.cantidad}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Selector de Estado con Botones Radiales Segmentados */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      {/* Cantidad Encontrada */}
                      <div className="flex items-center space-x-2">
                        <label className="text-[11px] font-semibold text-slate-600">Encontrados:</label>
                        <input
                          type="number"
                          min={0}
                          max={item.cantidad * 2}
                          value={state.cantidadEncontrada}
                          onChange={(e) =>
                            handleCantidadChange(item.id, parseInt(e.target.value, 10) || 0)
                          }
                          className="w-16 px-2 py-1 text-xs text-center font-bold rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                        />
                      </div>

                      {/* Botones de Estado */}
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleEstadoChange(item.id, 'PRESENTE_OPTIMO')}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            state.estadoItem === 'PRESENTE_OPTIMO'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Óptimo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEstadoChange(item.id, 'PRESENTE_DANADO')}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            state.estadoItem === 'PRESENTE_DANADO'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Dañado</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEstadoChange(item.id, 'FALTANTE')}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            state.estadoItem === 'FALTANTE'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Faltante</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Campo condicional de detalle de novedad */}
                  {isIssue && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-col space-y-1">
                      <label className="text-[11px] font-bold text-amber-900 flex items-center space-x-1">
                        <span>Descripción detallada de la novedad / daño:</span>
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Cable HDMI partido en la punta / Tecla rota / No se encontró en el aula..."
                        value={state.observacionNovedad}
                        onChange={(e) => handleObservacionChange(item.id, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Observaciones Generales del Acta */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Observaciones Generales del Espacio (Opcional)
          </label>
          <textarea
            rows={2}
            value={observacionesGenerales}
            onChange={(e) => setObservacionesGenerales(e.target.value)}
            placeholder="Anotaciones adicionales sobre aseo, iluminación, puertas, o estado del aula..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>

        {/* Resumen y Alertas Dinámicas */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-slate-500">Total:</span>{' '}
              <strong className="text-slate-800">{totalItems}</strong>
            </div>
            <div>
              <span className="text-emerald-700">Óptimos:</span>{' '}
              <strong className="text-emerald-800">{optimosCount}</strong>
            </div>
            <div>
              <span className="text-amber-700">Dañados:</span>{' '}
              <strong className="text-amber-800">{danadosCount}</strong>
            </div>
            <div>
              <span className="text-rose-700">Faltantes:</span>{' '}
              <strong className="text-rose-800">{faltantesCount}</strong>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                hayNovedades
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {hayNovedades ? '⚠️ Dictamen: CON NOVEDADES' : '✓ Dictamen: CONFORME'}
            </span>
          </div>
        </div>

        {/* Advertencia de Sanción en Check-Out con Novedades */}
        {tipo === 'CHECK_OUT' && hayNovedades && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Aviso de Responsabilidad y Sanción Preventiva:</h4>
              <p className="mt-0.5 leading-relaxed">
                Al reportar implementos con daño o faltantes en el Check-Out, el sistema registrará un acta de novedad y tu cuenta institucional quedará <strong>inhabilitada preventivamente para nuevas reservas</strong> hasta que el Gestor de Espacios evalúe el caso.
              </p>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
              tipo === 'CHECK_IN'
                ? 'bg-emerald-700 hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-600'
                : 'bg-slate-900 hover:bg-black focus:ring-2 focus:ring-slate-800'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>
              {tipo === 'CHECK_IN' ? 'Confirmar y Realizar Check-In' : 'Confirmar y Realizar Check-Out'}
            </span>
          </button>
        </div>
      </form>

      {/* Modal de Confirmación Previo al Envío */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-emerald-800 mb-3">
              <FileCheck className="h-6 w-6 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">
                Confirmar Envío de {tipo === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              ¿Estás seguro de emitir el acta digital para la <strong>Reserva #{reservaId}</strong> en <strong>{espacioNombre}</strong> con dictamen{' '}
              <strong className={hayNovedades ? 'text-amber-700' : 'text-emerald-700'}>
                {hayNovedades ? 'CON NOVEDADES' : 'CONFORME'}
              </strong>?
            </p>

            {hayNovedades && tipo === 'CHECK_OUT' && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                ⚠️ Se reportarán {danadosCount + faltantesCount} ítem(s) con novedad.
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Revisar de nuevo
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />
                    Enviando acta...
                  </>
                ) : (
                  <>
                    <span>Emitir Acta Oficial</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
