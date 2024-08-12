// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::SystemTray;
use tauri::{CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};
use tauri::Manager;

// Add the necessary imports for WebView2
use windows::core::PWSTR;
use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let tray_menu = SystemTrayMenu::new()
      .add_item(quit)
      .add_native_item(SystemTrayMenuItem::Separator)
      .add_item(hide)
      .add_item(show);
    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(tray)
        .invoke_handler(tauri::generate_handler![greet])
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs_watch::init())
        .on_system_tray_event(|app, event| match event {
              SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
              } => {
                app.get_window("main").unwrap().show().unwrap();
              }
              SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                  "quit" => {
                    std::process::exit(0);
                  }
                  "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                  }
                  "show" => {
                    app.get_window("main").unwrap().show().unwrap();
                  }
                  _ => {}
                }
              }
              _ => {}
            })
        .on_window_event(|event| match event.event() {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                  event.window().hide().unwrap();
                  api.prevent_close();
                }
                _ => {}
            })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
