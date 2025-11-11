//
//  AlarmNoteNotifications.swift
//  RapidBoilerplate
//
//  Mục đích: Swift Native Module cho iOS Notifications
//  Tham số vào: Alarm data từ React Native
//  Tham số ra: Promise results
//  Khi nào dùng: Khi cần schedule/cancel notifications từ JS
//

import Foundation
import UserNotifications

@objc(AlarmNoteNotifications)
class AlarmNoteNotifications: RCTEventEmitter {
  
  // MARK: - Properties
  
  private var hasListeners = false
  
  // MARK: - RCTEventEmitter Override
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return ["onAlarmAction", "onAlarmTapped"]
  }
  
  override func startObserving() {
    hasListeners = true
  }
  
  override func stopObserving() {
    hasListeners = false
  }
  
  // MARK: - Public Methods (Exposed to React Native)
  
  /**
   * Mục đích: Xin quyền notifications
   * Tham số vào: resolve, reject (Promise callbacks)
   * Tham số ra: Promise<Boolean>
   * Khi nào dùng: Khi app cần quyền gửi notification
   */
  @objc
  func requestAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let center = UNUserNotificationCenter.current()
    let options: UNAuthorizationOptions = [.alert, .sound, .badge, .timeSensitive]
    
    center.requestAuthorization(options: options) { granted, error in
      if let error = error {
        reject("AUTH_ERROR", "Lỗi xin quyền: \(error.localizedDescription)", error)
        return
      }
      resolve(granted)
    }
  }
  
  /**
   * Mục đích: Đăng ký notification categories và actions
   * Tham số vào: resolve, reject (Promise callbacks)
   * Tham số ra: Promise<Void>
   * Khi nào dùng: Sau khi xin quyền thành công
   */
  @objc
  func setCategories(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let center = UNUserNotificationCenter.current()
    
    // Define actions
    let snoozeAction = UNNotificationAction(
      identifier: "SNOOZE",
      title: "Snooze",
      options: []
    )
    
    let dismissAction = UNNotificationAction(
      identifier: "DISMISS",
      title: "Dismiss",
      options: [.destructive]
    )
    
    // Define category
    let category = UNNotificationCategory(
      identifier: "ALARM_NOTE",
      actions: [snoozeAction, dismissAction],
      intentIdentifiers: [],
      options: [.customDismissAction]
    )
    
    center.setNotificationCategories([category])
    resolve(nil)
  }
  
  /**
   * Mục đích: Schedule ONE_TIME notification
   * Tham số vào: payload (Dictionary), resolve, reject
   * Tham số ra: Promise<Void>
   * Khi nào dùng: Khi tạo alarm ONE_TIME
   */
  @objc
  func scheduleOneTime(
    _ payload: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let id = payload["id"] as? String,
          let title = payload["title"] as? String,
          let body = payload["body"] as? String,
          let timestamp = payload["timestamp"] as? Double,
          let noteId = payload["noteId"] as? String else {
      reject("INVALID_PAYLOAD", "Missing required fields", nil)
      return
    }
    
    let center = UNUserNotificationCenter.current()
    
    // Create content
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default
    content.categoryIdentifier = "ALARM_NOTE"
    content.interruptionLevel = .timeSensitive
    content.userInfo = ["alarmId": id, "noteId": noteId]
    
    // Create trigger
    let date = Date(timeIntervalSince1970: timestamp / 1000.0)
    let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
    let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
    
    // Create request
    let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
    
    center.add(request) { error in
      if let error = error {
        reject("SCHEDULE_ERROR", "Lỗi schedule: \(error.localizedDescription)", error)
        return
      }
      resolve(nil)
    }
  }
  
  /**
   * Mục đích: Schedule REPEATING notification
   * Tham số vào: payload (Dictionary), resolve, reject
   * Tham số ra: Promise<Void>
   * Khi nào dùng: Khi tạo alarm REPEATING
   */
  @objc
  func scheduleRepeatingWeekly(
    _ payload: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let id = payload["id"] as? String,
          let title = payload["title"] as? String,
          let body = payload["body"] as? String,
          let hour = payload["hour"] as? Int,
          let minute = payload["minute"] as? Int,
          let weekdays = payload["weekdays"] as? [Int],
          let noteId = payload["noteId"] as? String else {
      reject("INVALID_PAYLOAD", "Missing required fields", nil)
      return
    }
    
    let center = UNUserNotificationCenter.current()
    
    // Schedule một notification cho mỗi ngày trong tuần
    for weekday in weekdays {
      // Create content
      let content = UNMutableNotificationContent()
      content.title = title
      content.body = body
      content.sound = .default
      content.categoryIdentifier = "ALARM_NOTE"
      content.interruptionLevel = .timeSensitive
      content.userInfo = ["alarmId": id, "noteId": noteId]
      
      // Create trigger (weekday: 1=Sunday, 2=Monday, ..., 7=Saturday)
      var components = DateComponents()
      components.hour = hour
      components.minute = minute
      components.weekday = weekday + 1 // Convert 0-6 to 1-7
      
      let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
      
      // Create request với unique ID cho mỗi ngày
      let requestId = "\(id)_\(weekday)"
      let request = UNNotificationRequest(identifier: requestId, content: content, trigger: trigger)
      
      center.add(request) { error in
        if let error = error {
          print("Lỗi schedule weekday \(weekday): \(error.localizedDescription)")
        }
      }
    }
    
    resolve(nil)
  }
  
  /**
   * Mục đích: Hủy notification
   * Tham số vào: id (String), resolve, reject
   * Tham số ra: Promise<Void>
   * Khi nào dùng: Khi xóa hoặc disable alarm
   */
  @objc
  func cancel(
    _ id: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let center = UNUserNotificationCenter.current()
    
    // Cancel notification với ID này
    center.removePendingNotificationRequests(withIdentifiers: [id])
    
    // Cancel tất cả weekday variants (cho REPEATING alarms)
    let weekdayIds = (0...6).map { "\(id)_\($0)" }
    center.removePendingNotificationRequests(withIdentifiers: weekdayIds)
    
    resolve(nil)
  }
  
  /**
   * Mục đích: Lấy danh sách pending notifications
   * Tham số vào: resolve, reject
   * Tham số ra: Promise<Array<String>>
   * Khi nào dùng: Debug, kiểm tra pending notifications
   */
  @objc
  func getPending(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let center = UNUserNotificationCenter.current()
    
    center.getPendingNotificationRequests { requests in
      let ids = requests.map { $0.identifier }
      resolve(ids)
    }
  }
}
