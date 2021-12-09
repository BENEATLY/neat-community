/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { DashboardComponent } from '@app/dashboard/dashboard.component';
import { HomeComponent } from '@app/home/home.component';
import { LogInComponent } from '@app/login/login.component';
import { LanguageComponent } from '@app/language/language.component';
import { NavbarComponent } from '@app/navbar/navbar.component';
import { LeftBarComponent } from '@app/leftbar/leftbar.component';
import { SettingsVersionComponent } from '@app/settings/version/version.component';
import { SettingsLegalAdminComponent } from '@app/settings/legal/admin/legal.component';
import { SettingsPluginOverviewComponent } from '@app/settings/plugin/overview/overview.component';
import { SettingsRightComponent } from '@app/settings/right/right.component';
import { SettingsPluginActionRightComponent } from '@app/settings/pluginactionright/pluginactionright.component';
import { SettingsPluginOptionRightComponent } from '@app/settings/pluginoptionright/pluginoptionright.component';
import { SettingsUserComponent } from '@app/settings/user/user.component';
import { SettingsTeamComponent } from '@app/settings/team/team.component';
import { SettingsFunctionComponent } from '@app/settings/function/function.component';
import { SettingsSSLComponent } from '@app/settings/ssl/ssl.component';
import { SettingsLanguageComponent } from '@app/settings/language/language.component';
import { UserInfoComponent } from '@app/user/info/info.component';
import { UserLanguageComponent } from '@app/user/language/language.component';
import { UserSessionComponent } from '@app/user/session/session.component';
import { UserTimezoneComponent } from '@app/user/timezone/timezone.component';
import { UserLogOutComponent } from '@app/user/logout/logout.component';
import { FileComponent } from '@app/file/file.component';


// Imports: Template Components
import { TemplateFooterComponent } from '@templates/components/footer/footer.component';
import { TemplateNavigationHeaderComponent } from '@templates/components/navigation-header/navigation-header.component';
import { TemplateFilterPaletteComponent } from '@templates/components/filter-palette/filter-palette.component';
import { TemplateResultTableComponent } from '@templates/components/result-table/result-table.component';
import { TemplatePluginOptionBoxComponent } from '@templates/components/plugin-option-box/plugin-option-box.component';
import { TemplateObjectTableBoxComponent } from '@templates/components/object-table-box/object-table-box.component';
import { TemplateRowComponent } from '@templates/components/row/row.component';
import { TemplateNavigationButtonComponent } from '@templates/components/navigation-button/navigation-button.component';
import { TemplateActionBoxComponent } from '@templates/components/action-box/action-box.component';
import { TemplateItemBreakdownBoxComponent } from '@templates/components/item-breakdown-box/item-breakdown-box.component';
import { TemplateIconBlockComponent } from '@templates/components/icon-block/icon-block.component';
import { TemplateSelectBoxComponent } from '@templates/components/select-box/select-box.component';
import { TemplateFullMapComponent } from '@templates/components/full-map/full-map.component';
import { TemplateMapCardComponent } from '@templates/components/map-card/map-card.component';
import { TemplateMapBoxComponent } from '@templates/components/map-box/map-box.component';
import { TemplateItemBoxComponent } from '@templates/components/item-box/item-box.component';
import { TemplateGreetingTitleComponent } from '@templates/components/greeting-title/greeting-title.component';
import { TemplateImportantMessageComponent } from '@templates/components/important-message/important-message.component';
import { TemplateLeftNavLevel1Component } from '@templates/components/left-nav-level-1/left-nav-level-1.component';
import { TemplateLeftNavLevel2Component } from '@templates/components/left-nav-level-2/left-nav-level-2.component';

// Imports: Template Page

// Imports: Modals
import { LogModalComponent } from '@modals/log/log.component';
import { InfoModalComponent } from '@modals/info/info.component';
import { PropertyModalComponent } from '@modals/property/property.component';
import { PluginOptionModalComponent } from '@modals/plugin-option/plugin-option.component';
import { ServiceModalComponent } from '@modals/service/service.component';
import { LongContentModalComponent } from '@modals/longcontent/longcontent.component';
import { HelpModalComponent } from '@modals/help/help.component';
import { BoxHelpModalComponent } from '@modals/box-help/box-help.component';
import { PluginOptionHelpModalComponent } from '@modals/plugin-option-help/plugin-option-help.component';

// Imports: Focuses
import { ImageFocusComponent } from '@focuses/image/image.component';


// Construct Component Dictionary
const componentImportsDict = {
  'DashboardComponent': DashboardComponent,
  'HomeComponent': HomeComponent,
  'LogInComponent': LogInComponent,
  'LanguageComponent': LanguageComponent,
  'NavbarComponent': NavbarComponent,
  'LeftBarComponent': LeftBarComponent,
  'SettingsVersionComponent': SettingsVersionComponent,
  'SettingsLegalAdminComponent': SettingsLegalAdminComponent,
  'SettingsPluginOverviewComponent': SettingsPluginOverviewComponent,
  'SettingsRightComponent': SettingsRightComponent,
  'SettingsPluginActionRightComponent': SettingsPluginActionRightComponent,
  'SettingsPluginOptionRightComponent': SettingsPluginOptionRightComponent,
  'SettingsUserComponent': SettingsUserComponent,
  'SettingsTeamComponent': SettingsTeamComponent,
  'SettingsFunctionComponent': SettingsFunctionComponent,
  'SettingsSSLComponent': SettingsSSLComponent,
  'SettingsLanguageComponent': SettingsLanguageComponent,
  'UserInfoComponent': UserInfoComponent,
  'UserLanguageComponent': UserLanguageComponent,
  'UserSessionComponent': UserSessionComponent,
  'UserTimezoneComponent': UserTimezoneComponent,
  'UserLogOutComponent': UserLogOutComponent,
  'FileComponent': FileComponent,
  'TemplateFooterComponent': TemplateFooterComponent,
  'TemplateNavigationHeaderComponent': TemplateNavigationHeaderComponent,
  'TemplateFilterPaletteComponent': TemplateFilterPaletteComponent,
  'TemplateResultTableComponent': TemplateResultTableComponent,
  'TemplatePluginOptionBoxComponent': TemplatePluginOptionBoxComponent,
  'TemplateObjectTableBoxComponent': TemplateObjectTableBoxComponent,
  'TemplateRowComponent': TemplateRowComponent,
  'TemplateNavigationButtonComponent': TemplateNavigationButtonComponent,
  'TemplateActionBoxComponent': TemplateActionBoxComponent,
  'TemplateItemBreakdownBoxComponent': TemplateItemBreakdownBoxComponent,
  'TemplateIconBlockComponent': TemplateIconBlockComponent,
  'TemplateSelectBoxComponent': TemplateSelectBoxComponent,
  'TemplateFullMapComponent': TemplateFullMapComponent,
  'TemplateMapCardComponent': TemplateMapCardComponent,
  'TemplateMapBoxComponent': TemplateMapBoxComponent,
  'TemplateItemBoxComponent': TemplateItemBoxComponent,
  'TemplateGreetingTitleComponent': TemplateGreetingTitleComponent,
  'TemplateImportantMessageComponent': TemplateImportantMessageComponent,
  'TemplateLeftNavLevel1Component': TemplateLeftNavLevel1Component,
  'TemplateLeftNavLevel2Component': TemplateLeftNavLevel2Component,
  'LogModalComponent': LogModalComponent,
  'InfoModalComponent': InfoModalComponent,
  'PropertyModalComponent': PropertyModalComponent,
  'PluginOptionModalComponent': PluginOptionModalComponent,
  'ServiceModalComponent': ServiceModalComponent,
  'LongContentModalComponent': LongContentModalComponent,
  'HelpModalComponent': HelpModalComponent,
  'BoxHelpModalComponent': BoxHelpModalComponent,
  'PluginOptionHelpModalComponent': PluginOptionHelpModalComponent,
  'ImageFocusComponent': ImageFocusComponent
};

// Construct Component List
const componentImportsList = [DashboardComponent, HomeComponent, LogInComponent, LanguageComponent, NavbarComponent, LeftBarComponent, SettingsVersionComponent, SettingsLegalAdminComponent, SettingsPluginOverviewComponent, SettingsRightComponent, SettingsPluginActionRightComponent, SettingsPluginOptionRightComponent, SettingsUserComponent, SettingsTeamComponent, SettingsFunctionComponent, SettingsSSLComponent, SettingsLanguageComponent, UserInfoComponent, UserLanguageComponent, UserSessionComponent, UserTimezoneComponent, UserLogOutComponent, FileComponent, TemplateFooterComponent, TemplateNavigationHeaderComponent, TemplateFilterPaletteComponent, TemplateResultTableComponent, TemplatePluginOptionBoxComponent, TemplateObjectTableBoxComponent, TemplateRowComponent, TemplateNavigationButtonComponent, TemplateActionBoxComponent, TemplateItemBreakdownBoxComponent, TemplateIconBlockComponent, TemplateSelectBoxComponent, TemplateFullMapComponent, TemplateMapCardComponent, TemplateMapBoxComponent, TemplateItemBoxComponent, TemplateGreetingTitleComponent, TemplateImportantMessageComponent, TemplateLeftNavLevel1Component, TemplateLeftNavLevel2Component, LogModalComponent, InfoModalComponent, PluginOptionModalComponent, PropertyModalComponent, ServiceModalComponent, LongContentModalComponent, HelpModalComponent, BoxHelpModalComponent, PluginOptionHelpModalComponent, ImageFocusComponent];

// Get Component By Name
function getComponentImportByName(name) { return componentImportsDict[name]; }


// Export Dicts, Lists & Functions
export { componentImportsDict, componentImportsList, getComponentImportByName };
