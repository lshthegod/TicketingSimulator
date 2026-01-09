import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

describe('QueueController', () => {
  let controller: QueueController;
  let service: QueueService;

  const mockQueueService = {
    enterQueue: jest.fn(),
    leaveQueue: jest.fn(),
    getMyRank: jest.fn(),
  };

  // Guard 통과 후 request 객체 Mock
  const mockRequest = {
    user: { id: 1 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
    service = module.get<QueueService>(QueueService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('enter', () => {
    it('대기열 진입 로직을 호출해야 함', async () => {
      const eventId = '100';
      await controller.enter(eventId, mockRequest);

      expect(service.enterQueue).toHaveBeenCalledWith(eventId, mockRequest.user.id);
    });

    it('성공 메시지를 반환해야 함', async () => {
      const eventId = '100';
      const result = await controller.enter(eventId, mockRequest);
      
      expect(result).toEqual({ message: '대기열 진입 완료' });
    });
  });

  describe('leave', () => {
    it('대기열 이탈 로직을 호출해야 함', async () => {
      const eventId = '100';
      await controller.leave(eventId, mockRequest);

      expect(service.leaveQueue).toHaveBeenCalledWith(eventId, mockRequest.user.id);
    });

    it('성공 메시지를 반환해야 함', async () => {
      const eventId = '100';
      const result = await controller.leave(eventId, mockRequest);
      
      expect(result).toEqual({ message: '대기열 이탈 완료' });
    });
  });

  describe('status', () => {
    it('현재 대기 순서를 반환해야 함', async () => {
      const eventId = '100';
      const expectedRank = { rank: 5, total: 100 };
      
      mockQueueService.getMyRank.mockResolvedValue(expectedRank);

      const result = await controller.status(eventId, mockRequest);

      expect(service.getMyRank).toHaveBeenCalledWith(eventId, mockRequest.user.id);
      expect(result).toEqual(expectedRank);
    });
  });
});