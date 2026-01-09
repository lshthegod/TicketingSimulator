import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockEventsService = {
    create: jest.fn(),
    findAllByOpenAtAsc: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('이벤트를 생성해야 함', async () => {
      const dto = { title: 'New Event' } as any;
      const expectedResult = { id: 1, ...dto };
      
      mockEventsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('오픈 시간 순으로 정렬된 목록을 반환해야 함', async () => {
      const expectedResult = [{ id: 1, title: 'Event 1' }];
      
      // Controller의 findAll은 내부적으로 findAllByOpenAtAsc를 호출함
      mockEventsService.findAllByOpenAtAsc.mockResolvedValue(expectedResult);

      const result = await controller.findAll();
      expect(service.findAllByOpenAtAsc).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getServerTime', () => {
    it('서버 시간과 타임스탬프를 반환해야 함', () => {
      const result = controller.getServerTime();
      
      expect(result).toHaveProperty('serverTime');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.serverTime).toBe('string');
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('findOne', () => {
    it('ID로 특정 이벤트를 조회해야 함', async () => {
      const expectedResult = { id: 1, title: 'Event 1' };
      mockEventsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('이벤트를 업데이트해야 함', async () => {
      const dto = { title: 'Updated' } as any;
      const expectedResult = { id: 1, ...dto };
      
      mockEventsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(1, dto);
      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('이벤트를 삭제해야 함', async () => {
      mockEventsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(1);
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ deleted: true });
    });
  });
});