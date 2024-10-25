export interface ModBootJsonAddonPlugin {
  modName: string;
  addonName: string;
  modVersion: string;
  params?: any[] | { [key: string]: any };
}
