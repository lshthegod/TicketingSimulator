import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;
  let redisClient: any;

  // Pipeline 객체 Mock
  const mockPipeline = {
    zrem: jest.fn(),
    del: jest.fn(),
    set: jest.fn(),
    exec: jest.fn(),
  };

  // Redis Client Mock
  const mockRedisClient = {
    zadd: jest.fn(),
    pipeline: jest.fn().mockReturnValue(mockPipeline),
    get: jest.fn(),
    zrank: jest.fn(),
    zpopmin: jest.fn(),
    keys: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    redisClient = module.get('REDIS_CLIENT');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enterQueue', () => {
    it('대기열에 유저를 추가해야 함 (zadd)', async () => {
      const eventId = 'evt1';
      const userId = 1;

      mockRedisClient.zadd.mockResolvedValue(1);

      await service.enterQueue(eventId, userId);

      expect(redisClient.zadd).toHaveBeenCalledWith(
        `queue:waiting:${eventId}`,
        expect.any(Number), // timestamp
        userId.toString(),
      );
    });
  });

  describe('leaveQueue', () => {
    it('대기열과 활성 상태 모두에서 제거해야 함 (pipeline)', async () => {
      const eventId = 'evt1';
      const userId = 1;

      await service.leaveQueue(eventId, userId);

      expect(redisClient.pipeline).toHaveBeenCalled();
      expect(mockPipeline.zrem).toHaveBeenCalledWith(`queue:waiting:${eventId}`, userId.toString());
      expect(mockPipeline.del).toHaveBeenCalledWith(`queue:active:${eventId}:${userId}`);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('getMyRank', () => {
    const eventId = 'evt1';
    const userId = 1;

    it('활성 상태(ACTIVE)면 rank 0 반환', async () => {
      // get(activeKey)가 값을 반환하면 활성 상태
      mockRedisClient.get.mockResolvedValue('true');

      const result = await service.getMyRank(eventId, userId);

      expect(result).toEqual({ status: 'ACTIVE', rank: 0 });
    });

    it('대기 중(WAITING)이면 실제 순서 반환', async () => {
      // activeKey 없음, waitingKey에서 순위 조회됨
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.zrank.mockResolvedValue(4); // 0-based index

      const result = await service.getMyRank(eventId, userId);

      expect(result).toEqual({ status: 'WAITING', rank: 5 }); // 1-based index
    });

    it('대기열에도 없으면(NOT_IN_QUEUE) rank -1 반환', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.zrank.mockResolvedValue(null);

      const result = await service.getMyRank(eventId, userId);

      expect(result).toEqual({ status: 'NOT_IN_QUEUE', rank: -1 });
    });
  });

  describe('allowEntrance', () => {
    it('대기열에서 꺼내 활성 상태로 전환해야 함', async () => {
      const eventId = 'evt1';
      const count = 2;
      // zpopmin 반환값: [값, 점수, 값, 점수] 형태의 배열
      const popResult = ['1', '1000', '2', '1001']; 

      mockRedisClient.zpopmin.mockResolvedValue(popResult);

      await service.allowEntrance(eventId, count);

      expect(redisClient.zpopmin).toHaveBeenCalledWith(`queue:waiting:${eventId}`, count);
      // 파이프라인으로 set이 2번 호출되었는지 확인
      expect(mockPipeline.set).toHaveBeenCalledTimes(2);
      expect(mockPipeline.set).toHaveBeenCalledWith(
        expect.stringContaining('queue:active:'), // active key 체크
        'true',
        'EX',
        300
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('대기열이 비어있으면 아무것도 안 함', async () => {
      mockRedisClient.zpopmin.mockResolvedValue([]);

      await service.allowEntrance('evt1', 10);

      expect(mockPipeline.exec).not.toHaveBeenCalled();
    });
  });

  describe('getActiveEventIds', () => {
    it('키 패턴에서 eventId만 추출하여 반환해야 함', async () => {
      mockRedisClient.keys.mockResolvedValue(['queue:waiting:A', 'queue:waiting:B']);

      const result = await service.getActiveEventIds();

      expect(result).toEqual(['A', 'B']);
    });
  });
});