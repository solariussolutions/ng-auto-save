'use strict';

/*
  * Source: https://github.com/DmitryEfimenko/ng-auto-save
  * 
*/

angular.module('ng-auto-save', [])
    .service('autoSaveService', [function() {
        var self = this;
        self.autoSaveFnName = undefined;
        self.debounce = undefined;

        self.setAutoSaveFnName = function(name) {
            self.autoSaveFnName = name;
        };
        self.getAutoSaveFnName = function () {
            return self.autoSaveFnName;
        };
        self.setDebounce = function (d) {
            self.debounce = d;
        };
        self.getDebounce = function () {
            return self.debounce;
        };
    }])
    .directive('autoSave', ['autoSaveService',
        function (autoSaveService) {
            var savingEls = [];
            var savedEls = [];

            return {
                restrict: 'A',
                require: 'form',
                controller: function($scope, $element, $attrs) {
                    autoSaveService.setAutoSaveFnName($attrs.autoSave);
                    autoSaveService.setDebounce($attrs.autoSaveDebounce);

                    this.registerSavingEl = function(key, el) {
                        savingEls.push({ key: key, el: el });
                    };
                    this.registerSavedEl = function(key, el) {
                        savedEls.push({ key: key, el: el });
                    };
                    this.changeSavingVisibility = function(key, shouldShow) {
                        changeVisibility(savingEls, key, shouldShow);
                    };
                    this.changeSavedVisibility = function(key, shouldShow) {
                        changeVisibility(savedEls, key, shouldShow);
                    };

                    function changeVisibility(elArr, key, shouldShow) {
                        for (var j = 0, jl = elArr.length; j < jl; j++) {
                            if (elArr[j].key == key) {
                                if(shouldShow)
                                    elArr[j].el.removeClass('ng-hide');
                                else
                                    elArr[j].el.addClass('ng-hide');
                                break;
                            }
                        }
                    }
                }
            };
        }
    ])
    .directive('autoSaveField', ['$timeout', 'autoSaveService',
        function ($timeout, autoSaveService) {
            return {
                restrict: 'A',
                require: ['^autoSave', '^form', 'ngModel'],
                link: function ($scope, $elem, $attrs, $ctrls) {
                    var autoSaveCtrl = $ctrls[0];
                    var form = $ctrls[1];
                    var lastValidVal = undefined;
                    var ngModel = $attrs.ngModel;
                    var field = $attrs.autoSaveField;
                    var timeout = null;
                    var autoSaveFnName = autoSaveService.getAutoSaveFnName();
                    var debounce = autoSaveService.getDebounce();

                    $scope.$watch(ngModel, function(newVal, oldVal) {
                        if (newVal != oldVal && (lastValidVal || newVal != lastValidVal )) {
                            if (form.$valid) lastValidVal = newVal;
                            debounceSave(field, newVal, ngModel);
                        }
                    });

                    function debounceSave(prop, value, key) {
                        if (debounce) {
                            if (timeout) {
                                $timeout.cancel(timeout);
                            }
                            timeout = $timeout(function () {
                                save(prop, value, key);
                            }, debounce);
                        } else {
                            save(prop, value, key);
                        }
                    }

                    function save(prop, value, key) {
                        if (form.$valid) {
                            autoSaveCtrl.changeSavingVisibility(key, true);
                            autoSaveCtrl.changeSavedVisibility(key, false);
                            changeEnabled(false);
                            
                            $scope[autoSaveFnName](prop, value).then(
                                function () {
                                    autoSaveCtrl.changeSavingVisibility(key, false);
                                    autoSaveCtrl.changeSavedVisibility(key, true);
                                    changeEnabled(true);
                                },
                                    function (error) {
                                    console.log(error);
                                    autoSaveCtrl.changeSavingVisibility(key, false);
                                    changeEnabled(true);
                                }
                            );
                        } else {
                            autoSaveCtrl.changeSavedVisibility(key, false);
                            changeEnabled(true);
                        }
                    }

                    function changeEnabled(shouldEnable) {
                        if (shouldEnable) {
                            $elem.removeAttr('disabled');
                            $elem[0].focus();
                        } else
                            $elem.attr('disabled', 'disabled');
                    }
                }
            };
        }
    ])
    .directive('autoSaving', [
        function () {
            return {
                restrict: 'A',
                require: '^autoSave',
                link: function ($scope, $elem, $attrs, autoSaveCtrl) {
                    $elem.addClass('ng-hide');
                    autoSaveCtrl.registerSavingEl($attrs.autoSaving, $elem);
                }
            };
        }
    ])
    .directive('autoSaved', [
        function () {
            return {
                restrict: 'A',
                require: '^autoSave',
                link: function ($scope, $elem, $attrs, autoSaveCtrl) {
                    $elem.addClass('ng-hide');
                    autoSaveCtrl.registerSavedEl($attrs.autoSaved, $elem);
                }
            };
        }
    ]);
