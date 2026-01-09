import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEntity } from './entities/event.entity';
import { Repository } from 'typeorm';

describe('EventsService', () => {
  let service: EventsService;
  let repository: Repository<EventEntity>;

  // TypeORM Repository Mocking
  const mockEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    
    // 각 테스트 실행 전 Mock 초기화
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('이벤트를 생성하고 저장해야 함', async () => {
      const dto = { title: 'New Event' } as any;
      const expectedEntity = { id: 1, ...dto };

      // mock 설정: create는 객체를 반환, save는 저장된 객체(Promise) 반환
      mockEventRepository.create.mockReturnValue(dto);
      mockEventRepository.save.mockResolvedValue(expectedEntity);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedEntity);
    });
  });

  describe('findAllByOpenAtAsc', () => {
    it('오픈 시간 오름차순으로 조회해야 함', async () => {
      const expectedEvents = [{ id: 1, title: 'Event 1' }];
      mockEventRepository.find.mockResolvedValue(expectedEvents);

      const result = await service.findAllByOpenAtAsc();

      // 정확한 정렬 옵션으로 호출되었는지 확인
      expect(repository.find).toHaveBeenCalledWith({
        order: { openAt: 'ASC' },
      });
      expect(result).toEqual(expectedEvents);
    });
  });

  describe('findAllByCreatedAtDesc', () => {
    it('생성일 내림차순으로 조회해야 함', async () => {
      const expectedEvents = [{ id: 2, title: 'Event 2' }];
      mockEventRepository.find.mockResolvedValue(expectedEvents);

      const result = await service.findAllByCreatedAtDesc();

      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(expectedEvents);
    });
  });

  describe('findOne', () => {
    it('ID로 이벤트를 찾아야 함', async () => {
      const id = 1;
      const expectedEvent = { id, title: 'Found Event' };
      mockEventRepository.findOne.mockResolvedValue(expectedEvent);

      const result = await service.findOne(id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(expectedEvent);
    });

    it('이벤트가 없으면 null을 반환해야 함', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);
      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });
});