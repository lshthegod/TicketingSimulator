import { Test, TestingModule } from '@nestjs/testing';
import { EventOpenGuard } from './event-open.guard';
import { DataSource } from 'typeorm';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEntity } from 'src/events/entities/event.entity';

describe('EventOpenGuard', () => {
  let guard: EventOpenGuard;
  let dataSource: DataSource;
  let redisClient: any;

  // Mock Objects
  const mockDataSource = {
    manager: {
      findOne: jest.fn(),
    },
  };

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventOpenGuard,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          // @Inject('REDIS_CLIENT')에 맞춰 문자열 토큰으로 제공
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    guard = module.get<EventOpenGuard>(EventOpenGuard);
    dataSource = module.get<DataSource>(DataSource);
    redisClient = module.get('REDIS_CLIENT');

    jest.clearAllMocks();
    // 시간 제어를 위해 Fake Timer 사용 (필수)
    jest.useFakeTimers(); 
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper: ExecutionContext Mocking
  const createMockContext = (requestData: any): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(requestData),
      }),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('eventId가 없으면 통과(true)해야 함', async () => {
      const context = createMockContext({ params: {}, body: {} });
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    // 1. Redis Hit 케이스
    describe('Redis에 데이터가 있을 때', () => {
      it('오픈 시간이 지났으면 통과(true)', async () => {
        const eventId = 1;
        // 현재 시간: 2024-01-02
        jest.setSystemTime(new Date('2024-01-02T10:00:00Z'));
        
        // 오픈 시간: 2024-01-01 (과거)
        mockRedisClient.get.mockResolvedValue('2024-01-01T10:00:00.000Z');
        
        const context = createMockContext({ params: { eventId } });
        const result = await guard.canActivate(context);

        expect(redisClient.get).toHaveBeenCalledWith(`event:${eventId}:openAt`);
        expect(dataSource.manager.findOne).not.toHaveBeenCalled(); // DB 조회 안 함
        expect(result).toBe(true);
      });

      it('오픈 시간이 안 됐으면 ForbiddenException', async () => {
        const eventId = 1;
        // 현재 시간: 2023-12-31
        jest.setSystemTime(new Date('2023-12-31T10:00:00Z'));
        
        // 오픈 시간: 2024-01-01 (미래)
        mockRedisClient.get.mockResolvedValue('2024-01-01T10:00:00.000Z');

        const context = createMockContext({ body: { eventId } }); // body로 들어오는 케이스

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      });
    });

    // 2. Redis Miss -> DB 조회 케이스
    describe('Redis에 데이터가 없을 때', () => {
      const eventId = 1;
      const openAtDate = new Date('2024-01-01T10:00:00Z');

      beforeEach(() => {
        mockRedisClient.get.mockResolvedValue(null); // Redis Miss
      });

      it('DB에도 공연 정보가 없으면 NotFoundException', async () => {
        mockDataSource.manager.findOne.mockResolvedValue(null); // DB Miss

        const context = createMockContext({ params: { eventId } });

        await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
        expect(dataSource.manager.findOne).toHaveBeenCalled();
      });

      it('DB에 정보가 있으면 Redis에 캐싱하고, 시간 검증 후 통과', async () => {
        // 현재 시간: 2024-01-02 (오픈 이후)
        jest.setSystemTime(new Date('2024-01-02T10:00:00Z'));

        // DB Hit
        mockDataSource.manager.findOne.mockResolvedValue({
          id: eventId,
          openAt: openAtDate,
        } as EventEntity);

        const context = createMockContext({ params: { eventId } });
        const result = await guard.canActivate(context);

        // 검증 1: DB 조회 확인
        expect(dataSource.manager.findOne).toHaveBeenCalledWith(EventEntity, {
          where: { id: eventId },
          select: ['openAt'],
        });

        // 검증 2: Redis 캐싱 확인 (TTL 3600초 포함)
        expect(redisClient.set).toHaveBeenCalledWith(
          `event:${eventId}:openAt`,
          openAtDate.toISOString(),
          'EX',
          3600,
        );

        // 검증 3: 결과 통과
        expect(result).toBe(true);
      });

      it('DB 정보가 있어도 오픈 시간이 안 됐으면 ForbiddenException', async () => {
        // 현재 시간: 2023-12-31 (오픈 이전)
        jest.setSystemTime(new Date('2023-12-31T10:00:00Z'));

        mockDataSource.manager.findOne.mockResolvedValue({
          id: eventId,
          openAt: openAtDate,
        } as EventEntity);

        const context = createMockContext({ params: { eventId } });

        // Redis 캐싱은 수행되지만 결과는 예외
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        expect(redisClient.set).toHaveBeenCalled(); // 캐싱은 일어남
      });
    });
  });
});