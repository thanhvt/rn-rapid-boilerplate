//
//  AlarmNoteNotifications.m
//  RapidBoilerplate
//
//  Mục đích: Objective-C bridge cho Swift Native Module
//  Tham số vào: Không
//  Tham số ra: Không
//  Khi nào dùng: Bridge giữa React Native và Swift
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AlarmNoteNotifications, RCTEventEmitter)

// Request notification permission
RCT_EXTERN_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Set notification categories
RCT_EXTERN_METHOD(setCategories:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Schedule ONE_TIME notification
RCT_EXTERN_METHOD(scheduleOneTime:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Schedule REPEATING notification
RCT_EXTERN_METHOD(scheduleRepeatingWeekly:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Cancel notification
RCT_EXTERN_METHOD(cancel:(NSString *)id
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get pending notifications
RCT_EXTERN_METHOD(getPending:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
