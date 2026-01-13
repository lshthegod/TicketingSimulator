import { Test, TestingModule } from '@nestjs/testing';
import { SeatsService } from './seats.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeatEntity, SeatStatus } from './entities/seat.entity';
import { Repository } from 'typeorm';

describe('SeatsService', () => {
  let service: SeatsService;
  let repository: Repository<SeatEntity>;
  let redisClient: any;

  // Mock Objects
  const mockSeatsRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatsService,
        {
          provide: getRepositoryToken(SeatEntity),
          useValue: mockSeatsRepository,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<SeatsService>(SeatsService);
    repository = module.get<Repository<SeatEntity>>(getRepositoryToken(SeatEntity));
    redisClient = module.get('REDIS_CLIENT');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByEventId', () => {
    const eventId = 1;
    const cacheKey = `seats:event:${eventId}`;
    const dbSeats = [
      { id: 1, seatNo: 'A1', status: SeatStatus.AVAILABLE },
      { id: 2, seatNo: 'A2', status: SeatStatus.AVAILABLE },
    ];
    // 서비스 로직에서 변환되는 포맷 (slim version)
    const slimSeats = [
      { id: 1, no: 'A1', st: SeatStatus.AVAILABLE },
      { id: 2, no: 'A2', st: SeatStatus.AVAILABLE },
    ];

    it('Cache Hit: Redis에 데이터가 있으면 DB 조회 없이 반환', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify(slimSeats));

      const result = await service.findAllByEventId(eventId);

      expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).not.toHaveBeenCalled(); // DB 조회 X
      expect(result).toEqual(slimSeats);
    });

    it('Cache Miss: Redis에 없으면 DB 조회 후 캐싱하고 반환', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockSeatsRepository.find.mockResolvedValue(dbSeats);

      const result = await service.findAllByEventId(eventId);

      // 1. DB 조회 확인
      expect(repository.find).toHaveBeenCalledWith({
        where: { event: { id: eventId } },
        select: ['id', 'seatNo', 'status'],
        order: { seatNo: 'ASC' },
      });

      // 2. Redis 캐싱 확인 (변환된 데이터 저장)
      expect(redisClient.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(slimSeats),
        'EX',
        5,
      );

      // 3. 결과 확인
      expect(result).toEqual(slimSeats);
    });
  });

  describe('createBulk', () => {
    it('행(row)과 열(col)에 맞춰 좌석 엔티티를 생성하고 저장해야 함', async () => {
      const dto = { eventId: 1, rowCount: 2, seatPerCol: 2 }; // A, B행 / 1, 2열 -> 총 4개
      
      mockSeatsRepository.save.mockImplementation((seats) => Promise.resolve(seats));

      await service.createBulk(dto);

      expect(repository.save).toHaveBeenCalledTimes(1);
      
      // save에 전달된 인자 검증
      const savedSeats = mockSeatsRepository.save.mock.calls[0][0];
      expect(savedSeats).toHaveLength(4); // 2 * 2 = 4개
      
      // 생성된 좌석 번호 검증 (A1, A2, B1, B2)
      expect(savedSeats[0].seatNo).toBe('A1');
      expect(savedSeats[1].seatNo).toBe('A2');
      expect(savedSeats[2].seatNo).toBe('B1');
      expect(savedSeats[3].seatNo).toBe('B2');
      
      // 상태값 검증
      expect(savedSeats[0].status).toBe(SeatStatus.AVAILABLE);
    });
  });
});