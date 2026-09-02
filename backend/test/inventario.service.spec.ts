import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { InventarioService } from '../src/modules/inventario/inventario.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('InventarioService', () => {
  let service: InventarioService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      espacio: {
        findUnique: jest.fn(),
      },
      itemInventario: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventarioService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventarioService>(InventarioService);
  });

  describe('findByEspacio', () => {
    it('debe arrojar NotFoundException si el espacio no existe', async () => {
      prisma.espacio.findUnique.mockResolvedValue(null);
      await expect(service.findByEspacio(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar implementos no dados de baja ordenados', async () => {
      prisma.espacio.findUnique.mockResolvedValue({ id: 1 });
      const mockItems = [
        { id: 1, nombre: 'Balón de Fútbol', categoria: 'DEPORTIVO', estado: 'OPTIMO' },
      ];
      prisma.itemInventario.findMany.mockResolvedValue(mockItems);

      const result = await service.findByEspacio(1);
      expect(result).toEqual(mockItems);
      expect(prisma.itemInventario.findMany).toHaveBeenCalledWith({
        where: { espacioId: 1, estado: { not: 'DE_BAJA' } },
        orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
      });
    });
  });

  describe('findById', () => {
    it('debe arrojar NotFoundException si el implemento no existe', async () => {
      prisma.itemInventario.findUnique.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar el implemento con información de espacio', async () => {
      const mockItem = { id: 1, nombre: 'Smart TV 65"', espacio: { bloque: { sede: {} } } };
      prisma.itemInventario.findUnique.mockResolvedValue(mockItem);

      const result = await service.findById(1);
      expect(result).toEqual(mockItem);
    });
  });

  describe('create', () => {
    it('debe arrojar NotFoundException si el espacio físico no existe', async () => {
      prisma.espacio.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          espacioId: 999,
          codigo: 'TV-01',
          nombre: 'Smart TV',
          categoria: 'TECNOLOGIA',
          cantidad: 1,
          estado: 'OPTIMO',
          esCritico: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe arrojar ConflictException si ya existe un item con el mismo código en el espacio', async () => {
      prisma.espacio.findUnique.mockResolvedValue({ id: 1 });
      prisma.itemInventario.findUnique.mockResolvedValue({ id: 10, codigo: 'TV-01' });

      await expect(
        service.create({
          espacioId: 1,
          codigo: 'TV-01',
          nombre: 'Smart TV',
          categoria: 'TECNOLOGIA',
          cantidad: 1,
          estado: 'OPTIMO',
          esCritico: false,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe registrar exitosamente el nuevo implemento', async () => {
      prisma.espacio.findUnique.mockResolvedValue({ id: 1 });
      prisma.itemInventario.findUnique.mockResolvedValue(null);
      const createdItem = {
        id: 1,
        espacioId: 1,
        codigo: 'TV-01',
        nombre: 'Smart TV',
        categoria: 'TECNOLOGIA',
        cantidad: 1,
        estado: 'OPTIMO',
        esCritico: false,
      };
      prisma.itemInventario.create.mockResolvedValue(createdItem);

      const result = await service.create({
        espacioId: 1,
        codigo: 'TV-01',
        nombre: 'Smart TV',
        categoria: 'TECNOLOGIA',
        cantidad: 1,
        estado: 'OPTIMO',
        esCritico: false,
      });

      expect(result).toEqual(createdItem);
    });
  });

  describe('update', () => {
    it('debe actualizar los campos del implemento', async () => {
      prisma.itemInventario.findUnique.mockResolvedValue({ id: 1, nombre: 'Smart TV' });
      prisma.itemInventario.update.mockResolvedValue({ id: 1, nombre: 'Smart TV 4K' });

      const result = await service.update(1, { nombre: 'Smart TV 4K' });
      expect(result.nombre).toBe('Smart TV 4K');
    });
  });

  describe('remove', () => {
    it('debe marcar el implemento con estado DE_BAJA de manera lógica', async () => {
      prisma.itemInventario.findUnique.mockResolvedValue({ id: 1, nombre: 'Balón pinchado' });
      prisma.itemInventario.update.mockResolvedValue({ id: 1, estado: 'DE_BAJA' });

      const result = await service.remove(1);
      expect(result.estado).toBe('DE_BAJA');
      expect(prisma.itemInventario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'DE_BAJA' },
      });
    });
  });
});