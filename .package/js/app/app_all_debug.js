/**
 * @Descript: H5页面-地址
 */
(function ($, window, dd) {

    var tpl_address = $('#J_tpl_address'),
        tpl_address_content = $('#J_tpl_address_content');

    var bridge = window.bridge;

    var address_content,
        address_list;

    var isEdit = false; //是否编辑模式

    var History = window.History;

    function Address() {
        return {
            wrap: $('#J_address'),
            init: function (arg1, arg2, arg3) {
                var _this = this;

                _this.id = arg1;
                _this.type = arg2 || '';
                
                _this.address_data = undefined; //所有地址数据
                isEdit = false;

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageOut: function () {
                setTimeout(function () {
                    dd.lib.memCache.removeValue('update_delivery');
                }, 100)
            },
            setAfterPageIn: function(){
                this._setBtnText(isEdit?'取消':'编辑');
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'swipeid': History.getState().data.referer || 'index'
                };
                var tpl = dd.ui.tmpl(tpl_address.html(), options);
                _this.wrap.html(tpl);

                //loading
                address_content = _this.wrap.find('#J_address_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;

                _this.state = History.getState();
                _this.state_data = _this.state.data.data;
                _this.async = true;

                //店铺信息
                lib.mtop.request({
                    api: 'mtop.life.diandian.getUserAddressByUserId',
                    v: '1.0',
                    data: {
                        pagenum: 30
                    },
                    extParam: {}
                }, function (data) {
                    if (data.data) {
                        _this.address_data = data.data;

                        _this.startUp(data.data);
                    }
                    _this.async = false;
                }, function (data) {
                    dd.ui.toast(data, _this);
                    _this.async = false;
                });
            },
            _setBtnText: function (txt) {
                bridge.supportFunc("setOptionMenu") ? bridge.push("setOptionMenu", {
                    title: txt
                }, function () {
                }) : $('#J_address_options').text(txt);
            },
            startUp: function (data) {
                var _this = this;

                var options = {
                    'addressList': data.addressList,
                    'id': _this.id,
                    'swipeid': History.getState().data.referer || 'index',
                    'editCls': isEdit ? ' edit' : ''
                }

                //渲染
                var tpl = dd.ui.tmpl(tpl_address_content.html(), options);
                address_content.html(tpl);


                if (_this.type !== 'checkdelivery') {
                    bridge.supportFunc("showOptionMenu") ? bridge.push("showOptionMenu") : $('#J_address_options').show();
                }


                address_list = $('#J_address_list');

                !data.addressList.length && address_list.addClass("empty");

                _this._iScrollInit();
            },
            events: [
                [dd.event.click, '#J_address_add', '_addressAddHandler'],
                [dd.event.click, '#J_address_my', '_addressMyHandler'],
                [dd.event.click, 'li.J_address_item', '_addressItemHandler'],
                [dd.event.click, '#J_address_options', '_editHandler']
            ],
            //新增
            _addressAddHandler: function () {
                var ddid = 'address_operate/add/' + this.type;
                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'referer': 'address/' + this.id,
                            'data': {}
                        }
                    }
                };
                $('#J_address_operate').removeAttr('data-ddid');
                dd.lib.ddState(state_obj);
            },
            //查看我的淘宝地址列表
            _addressMyHandler: function (e, el) {
                this._getMyAddList($(el));
            },
            _addressItemHandler: function (e, el) {
                var _this = this;
                var index = $(el).index(), tar = e.target;
                if (_this.type == 'checkdelivery') {
                    dd.lib.memCache.set('update_checkdelivery_address', _this.address_data.addressList[index]);
                    dd.lib.localStorage.set('default_address', _this.address_data.addressList[index]);

                    var state_obj = {
                        'back': {
                            'ddid': 'delivery'
                        }
                    };
                    dd.lib.ddState(state_obj);
                } else {
                    if (!isEdit) {
                        _this._Use4Delivery(index);
                    } else if (tar != el) {
                        if ($(tar).hasClass('edit') || ($(tar).parent('span.edit') && $(tar).parent('span.edit').length)) {
                            _this._pushEdit($(el));
                            return;
                        }
                        if ($(tar).hasClass('del') || ($(tar).parent('span.del') && $(tar).parent('span.edit').length)) {
                            address_list.find("li").length > 1 ? _this._pushDelete($(el)) : dd.ui.toast("至少保留一个外卖地址哦");
                        }
                    }
                }
            },
            menuEvent:'_editHandler',
            //编辑
            _editHandler: function () {
                var _this = this;

                //请求中
                if (_this.async) {
                    return
                }

                if (!isEdit) {
                    address_list.children().addClass('edit');
                    _this._setBtnText("取消");
                    isEdit = true;
                } else {
                    address_list.children().removeClass('edit');
                    _this._setBtnText("编辑");
                    isEdit = false;
                }
                _this.mainScroll && _this.mainScroll.refresh();
            },
            //使用地址
            _Use4Delivery: function (index) {
                var _this = this;
                //console.log()
                //更新默认地址
                dd.lib.localStorage.set('default_address', _this.address_data.addressList[index]);

                //标记更新
                dd.lib.memCache.set('update_delivery', true);
                //触发回退
                //_this.wrap.find('.hd_back').trigger(dd.event.click);
                //History.back();

                if(/deliverycarte/.test(_this.type)) {
                    //外卖菜单页，后退回去
                    var state_obj = {
                    'back': {
                            'ddid': _this.type.split('_')[1]
                        }
                    };
                    dd.lib.ddState(state_obj);
                }else if(/carte_/.test(_this.type)){
                    var state_obj = {
                        'push': {
                            'ddid': 'carte/delivery/' + _this.type.split('_')[1]
                        }
                    };
                    dd.lib.ddState(state_obj);
                }else{
                    $("#J_delivery").removeAttr("data-ddid");
                    dd.lib.memCache.removeValue('delivery_filter_data');
                    var state_obj = {
                        'back': {
                            'ddid': 'delivery',
                            'multi': true
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            },
            _getMyAddList: function () {
                var ddid = 'my_address/get/' + this.type;
                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'referer': 'address/' + this.id
                        }
                    }

                };
                $('#J_my_address').removeAttr('data-ddid');
                dd.lib.ddState(state_obj);
            },
            _pushDelete: function (el) {
                var _this = this,
                    id = el.attr("data-id"),
                    defaultAddress = dd.lib.localStorage.get('default_address')
;

                if (defaultAddress && defaultAddress.id == id) {
                    dd.ui.toast("不能删除当前外卖地址哦");
                    return;
                }
                lib.mtop.request({
                    api: 'mtop.life.diandian.deleteUserAddressById',
                    v: '1.0',
                    data: {
                        id: id
                    },
                    extParam: {}
                }, function (d) {
                    if (d.data && d.data.result == 1) {
                        _this._spliceAddress(el.index());
                        el.remove();
                    }
                }, function (data) {
                    console.log(data);
                });
            },
            //删除地址数据
            _spliceAddress: function (index) {
                this.address_data['addressList'].splice(index, 1);
            },
            _pushEdit: function (el) {
                var _this = this,
                    index = el.index();
                var ddid = 'address_operate/' + el.data('id') + '/' + _this.type;
                $('#J_address_operate').removeAttr('data-ddid');

                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'data': _this.address_data['addressList'][index],
                            'referer': 'address/' + _this.id,
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },
            //滚动初始化
            _iScrollInit: function () {
                var _this = this;
                /*_this.mainScroll && _this.mainScroll.destroy();

                 _this.mainScroll = dd.ui.scroll({
                 'view': _this,
                 'wrap': '#J_address_scroll',
                 'pullDownAction': _this._pullDownAction
                 });*/

                this._scroll = dd.ui._scroll({
                    'wrap': '#J_address_scroll'
                })

            },
            _pullDownAction: function () {
                this._renderDynamic();
            }
        }
    }

    dd.app.Address = function () {
        return new Address;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-地址详情
 */
(function ($, window, dd) {
    var doc = window.document;

    var bridge = window.bridge;

    var address_map_panel = $('#J_address_map'),
        tpl_address_map = $('#J_tpl_address_map'),
        tpl_address_map_content = $('#J_tpl_address_map_content');

    var address_map_content;

    var amap_load = dd.lib.memCache.get('amap_load'); //高德脚本是否加载

    var History = window.History;

    var mapObj;

    function AddressMap() {
        return {
            wrap: address_map_panel,
            init: function (arg1, arg2) {
                var _this = this;
                _this.role = arg1;
                _this.type = arg2;

                _this.wrap.on('setAmapLoad', function (e) {
                    //地图异步加载回调
                    _this._renderDynamic();
                })

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageOut: function (i, o) {
                //恢复iscroll监听
                doc.addEventListener('touchmove', dd.event.touchmoveHandler, false);

                //销毁
                mapObj && (mapObj.destroy() || (mapObj = undefined));
            },
            setBeforePageIn: function (i, o) {
                //取消iscroll监听
                doc.removeEventListener('touchmove', dd.event.touchmoveHandler, false);

                //页面进入初始化地图
                if (!mapObj && amap_load) {
                    this._mapInit();
                }
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                //渲染
                var tpl = dd.ui.tmpl(tpl_address_map.html(), {'referer': History.getState().data.referer || 'index'});
                _this.startUp(tpl);

                //hack 展示地图页面
                if (_this.role == "show") {
                    $("#J_address_map_cancl").html("返回");
                    address_map_panel.find(".hd_title").html("<h2>查看</h2>");
                    bridge.push("setTitle", {title: "查看"});
                }

                //loading
                address_map_content = _this.wrap.find('#J_address_map_content').html(dd.ui.tpl.load);
            },
            _titleLazy: true,
            //动态渲染
            _renderDynamic: function () {
                var _this = this;

                if (!amap_load) {
                    _this._loadMapScript();
                } else {
                    address_map_content.html(tpl_address_map_content.html());
                    if (_this.role != "show") {
                        var url = History.getState().url,
                            id = url && dd.lib.getUriParam(url, 'ddid');
                        id = id || 'index';
                        dd._menuHandler = dd._menuHandler || {};
                        dd._menuHandler[id] = {context: _this, handler: '_saveHandler'};
                    }
                    _this._mapInit();
                    setTimeout(function () {
                        _this._setTitleBtn();
                    }, 300);
                }
            },
            _setTitleBtn: function () {
                var _this = this;
                if (_this.role != "show") {
                    if (bridge.supportFunc("setOptionMenu")) {
                        bridge.push("setOptionMenu", {
                            title: '保存'
                        })
                        bridge.push("showOptionMenu");
                    } else {
                        $('#J_address_map_save').show();
                    }
                }
                $("#J_address_map").find(".pointer").hide();
            },
            startUp: function (tpl) {
                this.wrap.html(tpl);
            },
            events: [
                [dd.event.click, '#J_address_map_save', '_saveHandler']
            ],
            //保存
            _saveHandler: function () {
                var _this = this;
                if (_this.async) {
                    return
                }
                _this.async = true;

                lib.mtop.request({
                    api: 'mtop.life.diandian.insertOrUpdateUserAddress',
                    v: '1.0',
                    data: {
                        'posx': mapObj.getCenter().getLng(),
                        'posy': mapObj.getCenter().getLat(),
                        'id': _this.address_data.id,
                        'address': _this.address_data.address,
                        'mobile': _this.address_data.mobile,
                        'citycode': _this.address_data.citycode,
                        'userName': _this.address_data.name,
                        'cityName': _this.address_data.cityName
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    $('#J_address').removeAttr('data-ddid');
                    _this.async = false;
                    //_this.wrap.find('#J_address_map_cancl').trigger(dd.event.click);
                    dd.lib.localStorage.set('default_address', _data);
                    dd.lib.memCache.set('update_delivery', true);

                    if(_this.type) {
                        if(/carte_/.test(_this.type)) {
                            ddid = 'carte/delivery/' + _this.type.split('_')[1];
                        }

                        var state_obj = {
                            'back': {
                                'ddid': ddid,
                                'multi': true
                            }
                        };
                        dd.lib.ddState(state_obj);
                    }else if (_this.role == 'add') {
                        var state_obj = {
                            'back': {
                                'ddid': 'delivery',
                                'multi': true
                            }
                        };
                        dd.lib.ddState(state_obj);
                        //history.go(-3);
                    } else {
                        var state_obj = {
                            'back': {
                                'ddid': 'address/' + _data.id,
                                'multi': true
                            }
                        };
                        dd.lib.ddState(state_obj);
                    }
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false;
                });
            },
            _loadMapScript: function () {
                var script = doc.createElement("script");
                script.type = "text/javascript";
                script.src = "http://webapi.amap.com/maps?v=1.2&key=92243f86c4efa64a75b5aff559f6a7cd&callback=onAmapLoad";
                doc.body.appendChild(script);
            },
            _mapInit: function () {
                var _this = this;
                console.log(_this.role);
                _this.role != "show" && dd.ui.toast('亲，请拖动地图确保你的地址准确');
                _this.address_data = History.getState().data.data;

                mapObj = new AMap.Map("J_map_container", {
                    center: new AMap.LngLat(_this.address_data.posx, _this.address_data.posy),
                    level: 13
                });

                if (_this.role == "show") {
                    var marker = new AMap.Marker({
                        position: mapObj.getCenter()
                    });
                    marker.setMap(mapObj);
                } else {
                    var marker = new AMap.Marker({
                        position: new AMap.LngLat(_this.address_data.posx, _this.address_data.posy),
                        draggable: true, //点标记可拖拽
                        cursor: 'move',  //鼠标悬停点标记时的鼠标样式
                        raiseOnDrag: true//鼠标拖拽点标记时开启点标记离开地图的效果
                    });
                    marker.setMap(mapObj);
                }

                _this.address_data.areas  && _this.address_data.areas.length && $.each(_this.address_data.areas, function(k, v){
                    _this._addPolygon(v, mapObj);
                });

                /*if (_this.address_data.areas && _this.address_data.areas.length) {
                    _this._addPolygon(_this.address_data.areas, mapObj);
                }*/
                //mapObj = new AMap.Map("J_map_container",{center:new AMap.LngLat(_this.address_data.posx, _this.address_data.posy), level:17});
                //mapObj.setZoomAndCenter(17,new AMap.LngLat(121.498586,31.239637))
                //在地图zoomchange事件中通过this指向当前操作的对象mapObj，获取缩放级别
                /*AMap.event.addListener(mapObj,'zoomstart',function(e){
                 this.setCenter(new AMap.LngLat(121.498586,31.239637))
                 });
                 AMap.event.addListener(mapObj,'zoomchange',function(e){
                 this.setCenter(new AMap.LngLat(121.498586,31.239637))
                 });
                 AMap.event.addListener(mapObj,'zoomend',function(e){
                 this.setCenter(new AMap.LngLat(121.498586,31.239637))
                 });*/
            },
            _addPolygon: function (data, map) {
                var polygonArr = new Array();//多边形覆盖物节点坐标数组
                for (var i = 0; i < data.length; i++) {
                    polygonArr.push(new AMap.LngLat(data[i].lo, data[i].la));
                }
                var polygon = new AMap.Polygon({
                    path: polygonArr,//设置多边形边界路径
                    strokeColor: "#464afa", //线颜色
                    strokeOpacity: 0.7, //线透明度
                    strokeWeight: 2,    //线宽
                    fillColor: "#cbf9f2", //填充色
                    fillOpacity: 0.6//填充透明度
                });
                polygon.setMap(map);
            }

        }
    }

    window.onAmapLoad = function () {
        amap_load = true;
        address_map_panel.trigger('setAmapLoad', [address_map_panel])

        dd.lib.memCache.set('amap_load', true);
    }

    dd.app.AddressMap = function () {
        return new AddressMap;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-地址详情
 */
(function ($, window, dd) {
    var bridge = window.bridge;

    var address_operate_panel = $('#J_address_operate');

    //script模板
    var tpl_address_operate = $('#J_tpl_address_operate');

    var initoff = false,
        event_hand = false;

    var address_info = {};

    var History = window.History;

    function AddressOperate() {
        return {
            wrap: address_operate_panel,
            init: function (arg1, arg2) {
                var _this = this;

                _this.async = false;

                _this.role = arg1;
                _this.type = arg2 || '';

                address_info.update = false;

                _this.state = History.getState();
                _this.state_data = _this.state.data || {};
                _this.state_data.data = _this.state_data.data || {};
                _this.state_data.referer = History.getState().data.referer || 'index';

                /*if (!_this.state_data.page) {
                 //$('#J_address_operate_cancl').trigger(dd.event.click)
                 History.back();
                 return;
                 }*/
                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
            },
            setBeforePageIn: function () {
                //城市更新
                if (dd.lib.memCache.get('update_city')) {
                    this._updateCity();
                }
            },
            setBeforePageOut: function () {
                document.activeElement.blur();
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;
                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    title: '保存'
                }, function () {
                });
                if (_this.role == 'add') {
                    //新增
                    _this.startUp();
                } else {
                    //编辑
                    _this._addressEdit();
                }
            },
            _addressEdit: function () {
                var _this = this;


                //复制一份地址
                for (var i in _this.state_data.data) {
                    address_info[i] = _this.state_data.data[i];
                }

                _this.startUp();
            },
            startUp: function () {
                var _this = this;
                //_this.state_data.role = _this.role;
                //渲染
                var tpl = dd.ui.tmpl(tpl_address_operate.html(), _this.state_data);
                address_operate_panel.html(tpl);

                for (var i in _this.state_data.data) {
                    address_info[i] = _this.state_data.data[i];
                }
                _this.input_user = address_operate_panel.find('.J_input_user');
                _this.input_phone = address_operate_panel.find('.J_input_phone');
                _this.input_address = address_operate_panel.find('.J_input_address');
                _this.input_city = address_operate_panel.find("#J_address_operate_city");

                var defaultAddress;
                if (defaultAddress = dd.lib.localStorage.get('default_address')
) {
                    dd.lib.memCache.set('address_operate_city', [defaultAddress.citycode, defaultAddress.cityName, defaultAddress.posx, defaultAddress.posy]);
                    dd.lib.memCache.set('update_city', true);
                    _this._updateCity();
                }
                /*_this.iScrollInit();*/
            },
            events: [
                [dd.event.click, '#J_address_operate_save', '_saveHandler'],
                [dd.event.click, '.J_switch_city', '_switchCityHandler'],
                [dd.event.click, '#J_modify_map', '_mapHandler']
            ],
            menuEvent:'_saveHandler',
            _saveHandler: function () {
                var _this = this;
                //保存地址
                if (_this.async) {
                    return
                }
                if (_this._validForm()) {
                    //修改过城市
                    //console.log(this.state_data.data.cityName+' '+address_info.cityName);
                    if (_this.state_data.data.address) {
                        if (address_info.update) {
                            _this._getPosxyByAddress();
                            return;
                        }
                    }

                    //修改过地址
                    //if (_this.state_data.data.address !== _this.input_address.val()) {
                    if (_this.state_data.data.address !== _this.input_address.val()) {
                        _this._getPosxyByAddress();
                        return
                    }

                    _this._saveOperate();
                }
            },
            //选择城市
            _switchCityHandler: function (e, el) {
                var state_obj = {
                    'push': {
                        'ddid': 'city_all',
                        'obj': {
                            'referer_citycode': $(el).data('citycode'),
                            'referer': 'address_operate/' + this.role
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },
            //修改地图
            _mapHandler: function () {
                var _this = this;
                if (_this._validForm()) {
                    //修改过地址
                    if ($.trim(_this.input_address.val())) {
                        //默认坐标
                        address_info.posx = _this.state_data.data.posx;
                        address_info.posy = _this.state_data.data.posy;

                        _this._pushMap();
                    } else {
                        dd.ui.toast('详细地址不能为空');
                    }
                }
            },
            //更新地址
            _updateCity: function () {
                var _this = this;

                _this.address_data = dd.lib.memCache.get('address_operate_city');
                $('#J_address_operate_city').text(_this.address_data[1]);

                //更新地址
                address_info.citycode = _this.address_data[0];
                address_info.cityName = _this.address_data[1];
                address_info.posx = _this.address_data[2];
                address_info.posy = _this.address_data[3];
                address_info.update = true;
            },
            _getPosxyByAddress: function () {
                var _this = this;

                _this.async = true;

                lib.mtop.request({
                    api: 'mtop.life.diandian.getPosxyByAddress',
                    v: '1.0',
                    data: {
                        'cityname': address_info.cityName,
                        'id': address_info.id,
                        'citycode': address_info.citycode,
                        'address': address_info.address
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    //更新坐标
                    address_info.posx = _data.posx;
                    address_info.posy = _data.posy;
                    _this._pushMap();

                    _this.async = false;
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false;
                });
            },
            _pushMap: function () {
                var _this = this;
                var v = 'address_map';
                if (_this.role == 'add') {
                    v = v + '/add' + '/' + _this.type;
                }else{
                    v = v + '/edit' + '/' + _this.type
                }
                $('#J_address_map').removeAttr('data-ddid')
                var state_obj = {
                    'push': {
                        'ddid': v,
                        'obj': {
                            'data': address_info,
                            'referer': 'address_operate/' + _this.role
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },
            //保存
            _saveOperate: function () {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.insertOrUpdateUserAddress',
                    v: '1.0',
                    data: {
                        'posx': address_info.posx,
                        'posy': address_info.posy,
                        'id': address_info.id,
                        'address': address_info.address,
                        'mobile': _this.input_phone.val(),
                        'citycode': address_info.citycode,
                        'userName': _this.input_user.val(),
                        'cityName': address_info.cityName
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    $('#J_address').removeAttr('data-ddid');
                    //更新默认地址
                    dd.lib.localStorage.set('default_address', _data);
                    //标记更新
                    dd.lib.memCache.set('update_delivery', true);

                    var exe = "push", id;// = _this.role == 'add' ? "delivery" : (!isNaN(_this.role) ? 'address/' + _this.role : History.getState().data.referer);

                    if(_this.type && /carte_/.test(_this.type)) {
                        //去菜单页
                        id = 'carte/delivery/' + _this.type.split('_')[1];
                    }else{
                        if(_this.role == 'add') {
                            id = 'delivery';
                        }else{
                            if(!isNaN(_this.role)) {
                                //回地址列表
                                id = 'address/' + _this.role;
                            }else{
                                id = History.getState().data.referer;
                            }
                        }
                    }
                    
                    for (var i = 0; i < dd.crumbs.length; i++) {
                        var step = dd.crumbs[i];
                        if (step == id) {
                            exe = "back"
                        }
                    }
                    console.log(exe+ ' ' +id)
                    var state_obj = {};
                    state_obj[exe] = {
                        'ddid': id,
                        'multi': _this.role == 'add' || _this.type ? true : false
                    };
                    dd.lib.ddState(state_obj);

                }, function (data) {
                    dd.ui.toast(data);
                });
            },
            //保存验证
            _validForm: function () {
                var _this = this;

                if (!_this.input_user.val()) {
                    dd.ui.toast('姓名不能为空');
                    return
                }
                if (!_this.input_phone.val()) {
                    dd.ui.toast('手机号码不能为空');
                    return
                }
                var phone_v = $.trim(_this.input_phone.val());
                if (!this._validPhone(phone_v)) {
                    return
                }
                if (!_this.input_address.val()) {
                    dd.ui.toast('详细地址不能为空');
                    return
                }

                address_info.name = _this.input_user.val();
                address_info.mobile = phone_v
                address_info.address = _this.input_address.val();
                address_info.cityName = _this.input_city.text();
                return true;
            },
            //验证电话
            _validPhone: function (v) {
                if (!v) {
                    dd.ui.toast('请输入手机号');
                    return
                }

                if (v > 13000000000 && v < 19000000000) {
                    return true;
                } else {
                    dd.ui.toast('请输入正确的手机号码！');
                }
            }
        }
    }

    dd.app.AddressOperate = function () {
        return new AddressOperate;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-地址
 */
(function ($, window, dd) {
    var bridge = window.bridge;

    var tpl_address = $('#J_tpl_my_address'),
        tpl_address_content = $('#J_tpl_my_addressItem');

    var address_content,
        address_list;

    var isEdit = false; //是否编辑模式

    var History = window.History;

    function myAddress() {
        return {
            wrap: $('#J_my_address'),
            init: function (arg1, arg2) {
                var _this = this;

                _this.id = arg1;
                _this.type = arg2 || '';
                _this.address_data = undefined; //所有地址数据
                isEdit = false;

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageOut: function(){
                dd.lib.memCache.removeValue('update_my_address');
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'alt': History.getState().data.referer || 'my_address'
                };
                var tpl = dd.ui.tmpl(tpl_address.html(), options);
                _this.wrap.html(tpl);

                //loading
                address_content = _this.wrap.find('#J_my_address_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;

                _this.state = History.getState();
                _this.state_data = _this.state.data.data;
                _this.async = true;

                //店铺信息
                lib.mtop.request({
                    api: 'mtop.life.diandian.getAllAddressFromTB',
                    v: '1.0',
                    data: {},
                    extParam: {}
                }, function (data) {
                    if (data.data) {
                        _this.address_data = data.data;
                        _this._buildTmpl(data.data);
                    }
                    _this.async = false;
                }, function (data) {
                    dd.ui.toast(data, _this);
                    _this.async = false;
                });
            },
            _buildTmpl: function (data) {
                var _this = this;

                var options = {
                    'myAddressList': data.list,
                    'swipeid': History.getState().data.referer || 'index'
                }
                //渲染
                var tpl = dd.ui.tmpl(tpl_address_content.html(), options);
                _this.startUp(tpl);

                address_list = $('#J_myaddress_list');

                //_this._iScrollInit();
                /*
                 _this.manualHandler();*/
            },
            startUp: function(tpl) {
                address_content.html(tpl);
            },
            events: [
                [dd.event.click, '.J_address_add', '_addHandler'],
                [dd.event.click, 'li.J_my_address_item', '_itemHandler']
            ],
            //新增
            _addHandler: function(){
                this._pushAdd();
            },
            _itemHandler: function(e,el){
                var index = $(el).index();
                this._pushAdd(this.address_data.list[index]);
            },
            //使用地址
            _pushAdd: function () {
                var ddid = 'address_operate/add/' + this.type;
                var d = arguments[0] || {};
                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'data': d,
                            'referer': 'my_address/get'
                        }
                    }
                };
                $('#J_address_operate').removeAttr('data-ddid');
                dd.lib.ddState(state_obj);
            }
        }
    }

    dd.app.MyAddress = function () {
        return new myAddress;
    };

})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-菜单
 */
(function ($, window, dd) {

    /*var _this.wrap = $('#J_carte');*/

    //script模板
    var tpl_carte = $('#J_tpl_carte'),
        tpl_carte_content = $('#J_tpl_carte_content'),
        tpl_carte_list = $('#J_tpl_carte_list'),
        tpl_cartepop = $('#J_tpl_cartepop'),
        CLS_CURRENT = 'current',
        CLS_DISABLE = 'disabled';


    var dialog_content,
        carte_content,
        bridge = window.bridge;
    /*mask,
     dialog,*/
    /*,
     dialog_temp = '<div class="carte_dialog"><div class="dialog_close_wrap J_carte_dialog_close"><i class="pop_close_icon"></i></div><div class="pop_wrap" id="J_carte_dialog_content"></div></div>';*/

    var bottom_tip,
        order_count,
        carte_sub,
        carte_sub_save,
        carte_sub_itg,
        reserve_difference;


    //存储访问过的店铺
    var carte_data = {}, //菜单数据
        item_data = {}, //商品详情数据

        inorder_data, //下单总计数据  // = dd.lib.localStorage.get('inorder_data') || {};

        itg_data, //智能点菜数据 入口关闭

        menuScroll, listScroll, galleryScroll;

    var History = window.History;

    function Carte() {
        return {
            wrap: $('#J_carte'),
            init: function (arg1, arg2, arg3, arg4) {
                var _this = this;
                _this.storeId = '';
                _this.takeoutShopId = '';
                _this.fromItg = false;

                _this.orderId = undefined; //修改订单id
                _this.optionType = 'diandefault';
                _this.carteType = '';

                _this.showItem = undefined; // 要展示的菜品

                if (arg1 == 'dian') {
                    //普通点菜
                    _this.storeId = arg2;
                    _this.showItem = arg3;
                }
                else if (/dianadd|dianmod/.test(arg1)) {
                    //增加 | 修改
                    _this.storeId = arg2;
                    _this.orderId = arg1.split('_')[1];
                    _this.optionType = arg1.split('_')[0];
                }
                else if (arg1 == 'delivery') {
                    //外卖
                    _this.takeoutShopId = arg2;
                    _this.carteType = arg1;
                    _this.showItem = arg3;
                }
                else if (arg1 == 'itg') {
                    //加入智能点菜
                    _this.storeId = arg2;
                    _this.fromItg = true;
                }

                _this.idPlus = _this.storeId || _this.takeoutShopId;

                //预定相关表示初始化
                _this.orderIndex = undefined;
                _this.orderTime = undefined;
                _this.autionId = undefined;
                _this.reserveTime = undefined; //预定
                _this.isReserve = false; //预定

                if (arg3 && arg4) {
                    _this.idPlus += arg3 + arg4;
                    _this.orderIndex = arg3;
                    _this.orderTime = arg4;
                    _this.isReserve = true;
                }

                _this.referer = History.getState().data.referer || '';
                _this.type = _this.takeoutShopId ? 2 : 1;

                _this.flag = null; //虚拟类目
                //_this.shopType = undefined;

                inorder_data = dd.lib.localStorage.get('inorder_data') || {};

                _this.reset_carte = dd.lib.memCache.get('reset_carte') || false; //是否添加增加过智能菜单

                _this.reserver_date = dd.lib.localStorage.get('reserve_date') || undefined;

                _this._canBuild = carte_data[_this.idPlus] && carte_data[_this.idPlus]['detailItems'];

                _this.slide_config = {
                    'minY': 0,
                    'maxY': 0,
                    'offsetTop': 0
                }
                _this.showDelivery = _this.showDelivery || {};
                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function () {
                var _this = this;
                if (_this._canBuild) {
                    //已有数据
                    _this._buildTmpl();

                    //TODO 修改渲染顺序
                    //_this._inOrderTotal(inorder_data[_this.idPlus]);
                }

                menuScroll && menuScroll.enable();
                listScroll && listScroll.enable();

                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    "icon": "http://g.dd.alicdn.com/tps/i3/T1ybhDFLFdXXXCWhje-36-36.png"
                }, function () {
                });
            },
            setAfterPageOut: function () {
                menuScroll && menuScroll.disable();
                listScroll && listScroll.disable();
            },
            setBeforePageOut: function () {
                //离开隐藏弹窗
                /*mask.hide().off('click');
                 dialog.hide().html('')*/
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    //'swipeid': _this.takeoutShopId ? History.getState().data.referer || 'delivery' : History.getState().data.backUri || (History.getState().data.referer || 'dian'),
                    'fromItg': _this.fromItg
                };

                var tpl = dd.ui.tmpl(tpl_carte.html(), options);
                _this.wrap.html(tpl);

                carte_sub_save = _this.wrap.find('#J_carte_sub_save');
                carte_sub_itg = _this.wrap.find('#J_carte_sub_itg');
                reserve_difference = _this.wrap.find('#J_Difference');

                //loading
                carte_content = _this.wrap.find('#J_carte_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                if (_this._canBuild) {
                    //已有数据
                    _this._inorderInit();
                    if (_this.carteType) {
                        var default_address = dd.lib.localStorage.get('default_address')
;
                        //没有收货地址
                        if(!default_address) {
                            _this._pushAddressList();
                            return;
                        }

                        var address = dd.lib.localStorage.get('default_address')
.id;
                        _this.showDelivery[address + "_" + _this.takeoutShopId]// && _this._showNavigationTip(); // _buildDeliveryTip 默认会处理_showNavigationTip
                        _this._buildDeliveryTip();
                    }
                    return;
                }

                _this._getCartes();
            },
            //获取菜单列表
            _getCartes: function () {
                var _this = this;

                if (_this.reserver_date && _this.isReserve) {
                    var date = _this.reserver_date;

                    _this.autionId = date.storeInfo.list[date.index].auctionId || null;
                    _this.reserveTime = _this.reserver_date.reserveTime || null;
                }

                lib.mtop.request({
                    api: 'mtop.life.diandian.getDetailItems',
                    v: '3.0',
                    data: {
                        'localstoreId': _this.storeId,
                        'takeoutShopId': _this.takeoutShopId,
                        'type': _this.type, //2外卖 1点菜
                        'shopType': 0, //0本地商户 12 外卖商户
                        'flag': 1, //1包括虚拟类目 0无
                        'reserveAuctionId': _this.autionId,
                        'reserveTime': _this.reserveTime
                    },
                    extParam: {}
                }, function (data) {
                    if (data.data) {

                        if(data.data.localstoreStatus && data.data.localstoreStatus !== '1') {
                            bridge.push('alert', {
                                title: '提示',
                                message: '该店目前' + (data.data.localstoreStatus == '0' ? '暂停营业' : '已歇业'),
                                buttons: ['确定']
                            });
                            dd.lib.ddState({
                                'back' : {}
                            })
                            return;
                        }

                        if(data.data.takeoutShopStatus && data.data.takeoutShopStatus !== '1' ) {
                            bridge.push('alert', {
                                title: '提示',
                                message: '该店目前' + (data.data.takeoutShopStatus == '0' ? '暂停营业' : '已歇业'),
                                buttons: ['确定']
                            });
                            dd.lib.ddState({
                                'back' : {}
                            })
                            return;
                        }
                        
                        carte_data[_this.idPlus] = {};
                        carte_data[_this.idPlus]['detailItems'] = data.data;
                        _this._inorderInit();
                        _this._buildTmpl();
                        _this.carteType && _this._buildDeliveryTip();
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            _goStoreDetail: function () {
                var _this = this,
                    _item = _this.wrap.find(".hd_icon");
                dd.lib.ddState({
                    'push': {
                        'ddid': _item.data("swipeid"),
                        'obj': {
                            'referer': _item.data("referer")
                        }
                    }
                })
            },
            _inorderInit: function () {
                var _this = this;
                inorder_data[_this.idPlus] = inorder_data[_this.idPlus] || dd.config.carte.resetInorderData();
                dd.lib.localStorage.set('inorder_data', inorder_data);
            },

            _buildDeliveryTip: function () {
                var _this = this;
                var address = dd.lib.localStorage.get('default_address')
;

                try {//todo 如果没有访问过delivery页面就没有默认地址
                    if (!address) {
                        lib.mtop.request({
                            api: 'mtop.life.diandian.getDefaultUserAddressById',
                            v: '1.0',
                            data: {},
                            extParam: {}
                        }, function (data) {
                            if (data.data) {
                                //刷新&不存在地址
                                dd.lib.localStorage.set('default_address', data.data.model);
                                _this.default_address = data.data.model;
                                address = data.data.model;
                                lib.mtop.request({
                                    api: 'mtop.takeout.delivery.check',
                                    v: '1.0',
                                    data: {
                                        'shopId': _this.takeoutShopId,
                                        'addressId': address.id
                                    },
                                    extParam: {}
                                }, function (data) {
                                    if (data.data) {
                                        _this.showDelivery[_this.default_address.id + "_" + _this.takeoutShopId] = data.data.delivery == "0";
                                        data.data.delivery == "0" && _this._showNavigationTip();
                                    }
                                }, function (data) {
                                    dd.ui.toast(data);
                                });
                            }
                        }, function (data) {
                            //没有默认地址
                            _this._pushAddressList();
                        });
                    } else {
                        lib.mtop.request({
                            api: 'mtop.takeout.delivery.check',
                            v: '1.0',
                            data: {
                                'shopId': _this.takeoutShopId,
                                'addressId': address.id
                            },
                            extParam: {}
                        }, function (data) {
                            if (data.data) {
                                _this.showDelivery = data.data.delivery == "0";
                                data.data.delivery == "0" && _this._showNavigationTip();
                            }
                        }, function (data) {
                            dd.ui.toast(data);
                        });
                    }
                } catch (e) {

                }
            },
            _pushAddressList: function(){
                dd.ui.toast('请先选择送餐地址');
                var state_obj = {
                    'push': {
                        'ddid': 'address/0/carte_' + this.takeoutShopId,
                        'obj': {
                            'referer': 'carte/delivery/' + this.takeoutShopId
                        }
                    }
                };
                dd.lib.ddState(state_obj);
                $('#J_carte').removeAttr('data-ddid');
            },
            _showNavigationTip: function () {
                var _this = this,
                    tpl = '<div class="navigate-tip-wrap"><div class="navigate-tip"><p class="title">抱歉！本店暂时无法配送到您选择的送餐地址。您可以<p class="option" rel="delivery">查看附近的外卖</p><p class="option" rel="address">更换送餐地址</p><p class="option last">取消</p></div></div><div>';

                var mask = $("<div class='mask'></div>").appendTo(".carte_wrap"),
                    navigationBar = $(tpl).appendTo(".carte_wrap");
                navigationBar.on("click", function (e) {
                    var tar = e.target, path;
                    if (tar.className && tar.className.indexOf('option') != -1) {
                        if (path = $(tar).attr("rel")) {
                            dd.lib.ddState({
                                'push': {
                                    'ddid': path == 'delivery' ? 'delivery' : 'address/' + dd.lib.localStorage.get('default_address')
.id + '/carte_'+ _this.takeoutShopId,
                                    'obj': {
                                        'referer': 'carte/delivery/' + _this.takeoutShopId
                                    }
                                }
                            })
                        }
                        mask.remove();
                        navigationBar.remove();
                        $('#J_carte, #J_delivery').removeAttr('data-ddid');
                    }
                });
            },
            _buildTmpl: function () {
                var _this = this;

                if (_this.fromItg) {
                    //来自智能点菜
                    _this._pushItgData();
                    //dd.lib.memCache.set('reset_carte', true);
                }
                /*else {
                 //清理智能菜单数据
                 //_this.reset_carte && _this.resetCarteDate();
                 }*/
                var _detailItems = carte_data[_this.idPlus]['detailItems'];

                var localstoreStatus = _detailItems['localstoreStatus']; //1 点菜
                //
                var options = {
                    'discountDesc': _detailItems.discountDesc  || '',
                    'notice': _detailItems.notice || '',
                    'mobile': localstoreStatus == '1' ? _detailItems['mobile'] : _detailItems['takeoutShopTele'],
                    'storeName': localstoreStatus == '1' ? _detailItems['storeName'] : _detailItems['takeoutShopName'],
                    'cateItems': _detailItems['cateItems'] ? _detailItems['cateItems'] : [],
                    'storeId': _this.storeId || _this.takeoutShopId,
                    'takeoutShopId': _this.takeoutShopId,
                    'alt': _this.takeoutShopId ? _this.referer || 'delivery' : _this.referer || 'dian',
                    'fromItg': _this.fromItg,
                    'reserverTime': _this.reserveTime
                };
                //渲染
                var tpl = dd.ui.tmpl(tpl_carte_content.html(), options);
                //dd.ui.toast.hide();
                carte_content.html(tpl);

                if (!options.cateItems.length) {
                    return
                }

                bottom_tip = $('#J_carte_bottom_tip');
                order_count = bottom_tip.find('.J_order_count');
                carte_sub = _this.wrap.find('.J_carte_sub');

                var menu_wrapper = _this.wrap.find('#J_menu_wrapper'),
                    menu_height = menu_wrapper.children().height();

                _this.slide_config.el = menu_wrapper.children();
                _this.slide_config.maxY = menu_height - menu_wrapper.height();
                _this.slide_config.offsetTop = menu_wrapper.offset().top;

                _this._iScrollInit();
                _this._manualHandler();
                if (dd._hideTitleBar) {
                    bridge.push("setTitle", {
                        title: options.storeName || "淘点点"
                    });
                }

                if(_this.takeoutShopId) {
                    dd.common.delivery.getTags({
                        id: _this.takeoutShopId,
                        callback: function(data){
                            _this._buildDeliveryTags(data)
                        }
                    })
                }
            },
            _buildDeliveryTags: function(tagData){
                var _this = this;
                if(!tagData.result || !tagData.result.length) {
                    return
                }
                
                var detailItems = carte_data[_this.idPlus]['detailItems'];

                var discount_item = _this.wrap.find('#J_discount_item');

                var tagarr = [];
                if(!detailItems.notice) {
                    //无公告
                    $.each(tagData.result, function(k, v){
                        if(k==0) {
                            //显示第一条优惠西信息
                            discount_item.parents('.discount_line').show();
                            _this.wrap.find('.carte_content').addClass('has_tip');
                            _this.wrap.find('.icon_hui').css({
                                backgroundImage: 'url('+ v.picPath +')',
                                backgroundPosition: '0 0',
                                backgroundSize: 'cover'
                            });
                            discount_item.children().html(v.desc);
                        }else{
                            tagarr.push('<i class="tag" style="background-image:url('+ v.picPath +')"></i>');
                        }
                    });
                }else{
                    // 有公告 优惠icon右侧显示
                    $.each(tagData.result, function(k, v){
                        tagarr.push('<i class="tag" style="background-image:url('+ v.picPath +')"></i>');
                    });
                }
                discount_item.append(tagarr.join(''));
            },
            //推入智能菜单
            _pushItgData: function () {
                var _this = this;
                var state = History.getState(),
                    cateItems = carte_data[_this.idPlus].detailItems.cateItems;

                itg_data = state.data.intelligent2carte;

                //重置订单数据
                inorder_data[_this.idPlus]['itg']/*['v']*/ = {};
                inorder_data[_this.idPlus]['itg']/*['n']*/ = {};
                dd.lib.localStorage.set('inorder_data', inorder_data);

                _this._eachItg(cateItems, 0);
                setTimeout(function () {
                    _this._inOrderTotal(inorder_data[_this.idPlus]);
                }, 100)
            },
            //重写数据
            _eachItg: function (cateItems, c_index) {
                var _this = this;
                var carte = cateItems[c_index];

                if (!carte) {
                    return;
                }

                var list = carte.itemList;
                var c = 0;
                for (var i = 0, len = list.length; i < len; i++) {
                    var item = list[i];

                    var ids = item.itemId;
                    if (item.sku.length) {
                        //item = sku [?]
                    }

                    var itg_item = itg_data['itg_' + ids];
                    if (itg_item) {

                        var inorder_item = inorder_data[_this.idPlus]['itg']
                        /*,
                         inorder_item_n = inorder_item.n,
                         inorder_item_v = inorder_item.v;*/

                        var longid = item.itemId;

                        /*if (carte.flag) {
                         //虚拟类目
                         inorder_item_v[longid] = item;
                         inorder_item_v[longid].inOrder = parseInt(itg_item.inOrder);
                         }*/

                        inorder_item[longid] = item;
                        inorder_item[longid].inOrder = parseInt(itg_item.inOrder);

                        dd.lib.localStorage.set('inorder_data', inorder_data);

                        c++;

                    } else {
                        //item.inOrder = undefined;
                    }
                    //(c>0) && (carte.inOrderMenu = c);

                }
                c_index++
                _this._eachItg(cateItems, c_index);

            },

            //渲染后业务
            _manualHandler: function () {
                var _this = this;

                var discount_item = _this.wrap.find('#J_discount_item');
                if (discount_item.length) {
                    var discount_item_child = discount_item.children();
                    if (discount_item_child.width() > discount_item.width()) {
                        discount_item.addClass('marquee_alternate');
                    }
                }

                _this.startUp($('#J_carte_menu li').first());
                _this._syncMenuLeft();

                if (inorder_data[_this.idPlus]) {
                    //已有数据
                    _this._inOrderTotal(inorder_data[_this.idPlus]);
                }
            },
            //右侧菜品列表
            startUp: function (el) {
                var _this = this;

                if (el.hasClass(CLS_CURRENT) || el.hasClass('none')) {
                    return;
                }

                //记录虚拟类目
                _this.flag = el.data('flag');

                var index = el.index(),
                    data = carte_data[_this.idPlus]['detailItems']['cateItems'][index],
                    tpl = dd.ui.tmpl(tpl_carte_list.html(), {
                        'data': data,
                        'reserveTime': _this.reserveTime
                    });

                $('#J_carte_list').html(tpl);

                el.addClass(CLS_CURRENT).siblings('.' + CLS_CURRENT).removeClass(CLS_CURRENT);

                _this._syncMenuRight(el);

                /*listScroll.scrollTo(0, 0);
                 listScroll.refresh();*/
            },
            events: [
                [dd.event.click, '#J_carte_menu li', '_menuHandler'],
                [dd.event.click, '.J_carte_options', '_optionsHandler'],
                [dd.event.click, '.J_Carte_Arrow', '_showSku'],
                [dd.event.click, '.J_discount_del', '_discountDelHandler'],
                [dd.event.click, '#J_carte_sub_save', '_subSaveHandler'],
                [dd.event.click, '#J_carte_sub_itg', '_subItgHandler'],
                [dd.event.click, '#J_carte_list .J_pop_detail', '_popHandler'],
                [dd.event.click, '.J_carte_pop_options', '_popOptionsHandler'],
                [dd.event.click, '.J_pop_add', '_popAddHandler'],
                ['touchstart', '#J_menu_wrapper .menu_scroller', '_touchstartHandler'],
                ['touchmove', '#J_menu_wrapper .menu_scroller', '_touchmoveHandler'],
                ['touchend', '#J_menu_wrapper .menu_scroller', '_touchendHandler']
            ],
            menuEvent: "_goStoreDetail",
            _menuHandler: function (e, el) {
                var _this = this;
                //hack android
                if (!dd.device.iosStyle) {
                    window.scrollTo(0, 0);
                }
                _this.startUp($(el));
            },

            _showSku: function (e, el) {
                $(el).toggleClass('down');
                $(el).parent('.items_wrap').next('.J_CarteSku').toggle();
            },
            _optionsHandler: function (e, el) {
                this._carteOptions($(el));
            },
            // 弹窗详情加入菜单
            _popAddHandler: function(e, el){
                var _this = this;
                var $el = $(el),
                    li = _this.wrap.find('#J_carte_item_' + $el.data('itemid'));

                $el.hide().siblings().show();

                // 触发元素
                var trigger_el = li.find('.plus');
                
                this._carteOptions(trigger_el, true);
            },
            // 弹窗详情加减菜
            _popOptionsHandler: function (e, el) {
                var _this = this;
                var $el = $(el),
                    role = $el.data('role'),
                    li = _this.wrap.find('#J_carte_item_' + $el.data('itemid'));

                // 触发元素
                var trigger_el = li.find('.' + role);
                
                this._carteOptions(trigger_el, true);
            },
            //关闭优惠信息
            _discountDelHandler: function (e, el) {
                var _this = this;
                $(el).parents('.discount_line').remove();
                carte_content.find('.has_tip').removeClass('has_tip');

                menuScroll && menuScroll.refresh();
                listScroll && listScroll.refresh();

                carte_data[_this.idPlus]['detailItems'].discountDesc = null;
                carte_data[_this.idPlus]['detailItems'].notice = null;
            },
            _popHandler: function (e, el) {
                var $target = $(e.target);
                if ($target.hasClass('arrow') || $target.hasClass('arrow_wrap')) {
                    return;
                }
                this._showCartePop($(el));
            },
            _touchstartHandler: function (e, el) {
                var _this = this,
                    slide_config = _this.slide_config;

                if (!dd.device.iosStyle && slide_config.maxY > 0) {
                    slide_config.moveon = true;

                    slide_config.el[0].style.webkitTransition = '0ms';
                    slide_config.d_y = e.touches[0].pageY - document.body.scrollTop;

                    var current_t = slide_config.el[0].style.webkitTransform;
                    if (current_t) {
                        var reg_y = current_t.match(/\-?[0-9]+/g);
                        slide_config.current_y = parseInt(reg_y[0]);
                    } else {
                        slide_config.current_y = 0;
                    }
                }

            },
            _touchmoveHandler: function (e) {
                var _this = this,
                    slide_config = _this.slide_config;

                if (slide_config.moveon) {
                    e.preventDefault();
                    setTimeout(function () {
                        ;
                        slide_config.y = e.touches[0].pageY - document.body.scrollTop;

                        slide_config.s_y = slide_config.y - slide_config.d_y;

                        slide_config.el[0].style.webkitTransform = 'translateY(' + (slide_config.s_y + slide_config.current_y) + 'px)';
                    }, 0);

                }
            },
            _touchendHandler: function (e) {
                var _this = this,
                    slide_config = _this.slide_config;
                if (slide_config.moveon) {
                    setTimeout(function () {
                        var _endx = slide_config.el[0].style.webkitTransform;

                        if (_endx) {
                            _endx = _endx.match(/\-?[0-9]+/g);
                            var endx = _endx[0]

                            if (endx > 0) {
                                _this._move(0)
                            }

                            if (endx < -slide_config.maxY) {
                                _this._move(-slide_config.maxY)
                            }
                        }

                        slide_config.moveon = false;
                    }, 10)
                }
            },
            _move: function (x) {
                var _this = this,
                    slide_config = _this.slide_config;

                slide_config.el[0].style.webkitTransition = '100ms';
                slide_config.el[0].style.webkitTransform = 'translateY(' + (x) + 'px)';
            },
            //选好了
            _subSaveHandler: function (e, el) {
                var _this = this;

                if (!$(el).hasClass(CLS_DISABLE)) {
                    bridge.push("login", function () {
                        _this._carteSub();
                    });
                }
            },
            //智能点菜确定
            _subItgHandler: function (e, el) {
                !$(el).hasClass(CLS_DISABLE) && this._carteSubItg();
            },
            //同步左侧统计
            _syncMenuLeft: function () {
                var _this = this, leftc = {}, _data,
                    data = inorder_data[_this.idPlus];

                if (!data) {
                    return;
                }

                if (_this.fromItg) {
                    //智能点菜
                    _data = data['itg'];
                } else {
                    //点菜
                    _data = data['carte'];//
                }

                /* var _data_n = _data.n;*/
                var _carte = carte_data[_this.idPlus]['detailItems']['cateItems'];

                //循环所有菜单
                $.each(_carte, function (k, v) {
                    //console.log(v)
                    var cateid = v.cateId;
                    $.each(v.itemList, function (i, o) {
                        //console.log(o.itemId);
                        var itemid = o.itemId;//console.log(itemid)

                        var sku = o.sku;
                        if (sku && sku.length) {
                            $.each(sku, function (j, q) {
                                itemid = itemid + '_' + q.skuId;
                                if (_data[itemid]) {
                                    if (!leftc[cateid]) {
                                        leftc[cateid] = 1;
                                    } else {
                                        leftc[cateid] += 1;
                                    }
                                }
                                itemid = o.itemId;
                            });
                        } else {
                            //匹配存储的菜单
                            if (_data[itemid]) {

                                if (!leftc[cateid]) {
                                    leftc[cateid] = 1;
                                } else {
                                    leftc[cateid] += 1;
                                }

                            }
                        }

                        //触发menu item pop
                        if(_this.showItem && o.itemId == _this.showItem) {
                            _this._menuHandler('', document.getElementById('J_carte_menu_' + cateid))
                            _this._popHandler('', document.querySelector('#J_carte_item_' + itemid + ' .J_pop_detail'));
                        }

                    })
                });

                $.each(leftc, function (k, v) {
                    var li = $('#J_carte_menu_' + k);
                    //标识非虚拟目录
                    if (!li.data('flag')) {
                        li.find('.J_menu_count').removeClass('dn').text(v);
                    }
                })
            },
            //同步右侧统计
            _syncMenuRight: function (el) {
                var _this = this,
                    data = inorder_data[_this.idPlus];

                if (!data) {
                    return
                }

                var _data;
                if (_this.fromItg) {
                    //智能点菜
                    _data = data['itg'];
                } else {
                    //点菜
                    _data = data['carte'];//
                }
                /*_data = _this.flag ? _data.v : _data.n*/
                ; //是否虚拟类目数据

                $.each(_data, function (k, v) { //k: cateid_menuid_skuid
                    var keys = k.split('_');
                    var skuid;
                    if (keys.length == 2) {
                        //sku
                        skuid = keys[1];
                    }

                    var cid = keys[0],
                        item = $('#J_carte_item_' + cid),
                        carte_options,
                        carte_count,
                        sku_arrow, //sku箭头
                        sku_wrap; //sku容器
                    if (item) {
                        if (skuid) {
                            var sku_item = carte_options = item.find('.J_sku_' + skuid);
                            carte_options = sku_item.find('.J_carte_options');
                            carte_count = sku_item.find('.J_carte_count');
                            sku_wrap = item.find('.J_CarteSku');
                            sku_arrow = item.find('.J_Carte_Arrow');
                        } else {
                            carte_options = item.find('.J_carte_options');
                            carte_count = item.find('.J_carte_count');
                        }

                        carte_options.removeClass('dn');
                        carte_count.removeClass('dn').text(v.inOrder);

                        //sku显示状态
                        if (v.inOrder && skuid) {
                            sku_wrap.show();
                            sku_arrow.addClass('down');
                        }
                    }

                });
            },
            //提交智能列表
            _carteSubItg: function () {
                var _this = this;
                $('#J_carte_intelligent').attr('data-ddid', '');

                var s_arr = [];
                $.each(inorder_data[_this.idPlus]['itg']/*.n*/, function (k, v) {
                    s_arr.push(v);
                });

                var ddid = 'carte_intelligent/' + _this.storeId;
                var state_obj = {
                    'back': {
                        'ddid': ddid,
                        'obj': {
                            'carteData': {
                                'items': s_arr,
                                'totalPrice': itg_data.totalPrice
                            },
                            'referer': 'carte/dian/' + _this.storeId
                        }
                    }
                };
                dd.lib.ddState(state_obj);


                /*setTimeout(function(){
                 $('#J_carte_intelligent').children().removeAttr('data-ddid')
                 History.replaceState(state_obj, '淘点点', '?_ddid=' + ddid);
                 },0)*/
            },
            _carteSub: function () {
                var _this = this,
                    info = [],
                    ddid,
                    state_obj;

                carte_sub_save.addClass(CLS_DISABLE);

                dd.ui.toast.loading();

                $.each(inorder_data[_this.idPlus]['carte']/*.n*/, function (k, v) {
                    info.push(v.itemId + ':' + (v.skuId ? v.skuId : '') + ':' + v.inOrder);
                });

                //提交订单数据
                lib.mtop.request({
                    api: 'mtop.life.diandian.optionCart',
                    v: '1.0',
                    data: {
                        'storeId': _this.type == 1 ? _this.storeId : _this.takeoutShopId,
                        'o': 0,
                        'info': info.join(';'),
                        'bizLine': _this.type == 1 ? 0 : 1,
                        'reserveAuctionId': _this.autionId,
                        'reserveTime': _this.reserveTime,
                        'orderOption': dd.config.optioncart[_this.optionType],
                        'orderId': _this.orderId,
                        'platform': dd.mtop_platform
                    }
                }, function (data) {
                    dd.ui.toast.hide();
                    if (data.data) {
                        $('#J_carte').attr('data-ddid', '');
                        if (_this.type == 1) {
                            //点菜(如有预定，转去预定下单)
                            if (_this.reserver_date && _this.isReserve) {
                                ddid = 'reserve_confirm';
                                $('#J_reserve_confirm').attr('data-ddid', '');
                            } else {
                                ddid = 'carte_check/' + _this.storeId + (_this.orderId ? '/' + _this.optionType + '_' + _this.orderId : '');
                                $('#J_carte_check').attr('data-ddid', '');
                            }
                            state_obj = {
                                'push': {
                                    'ddid': ddid,
                                    'obj': {
                                        'data': data.data,
                                        'referer': 'carte/dian/' + _this.storeId,
                                        'num': 1,
                                        'serveType': carte_data[_this.idPlus]['detailItems'].serveType
                                    }
                                }
                            };
                        }
                        else if (_this.type == 2) {
                            //外卖
                            ddid = 'carte_checkdelivery/' + _this.takeoutShopId;

                            $('#J_carte_checkdelivery').attr('data-ddid', '');
                            state_obj = {
                                'push': {
                                    'ddid': ddid,
                                    'obj': {
                                        'data': data.data,
                                        'referer': 'carte/delivery/' + _this.takeoutShopId
                                    }
                                }
                            };
                        }

                        dd.lib.ddState(state_obj);
                    }
                    carte_sub_save.removeClass(CLS_DISABLE);
                }, function (data) {
                    dd.ui.toast(data);
                    carte_sub_save.removeClass(CLS_DISABLE);
                });
            },

            initDialog: function () {
                this._popdialog = dd.ui.dialog({
                    'cls': 'carte_dialog',
                    'title': '',
                    'wrap': '#J_carte',
                    'content': dd.ui.tpl.load,
                    'maxheight': '246'
                });

                dialog_content = this.wrap.find('.J_dialog_content');
            },

            //弹出
            _showCartePop: function (el) {
                var _this = this,
                    id = el.attr('data-id');

                _this.initDialog();

                if (!item_data[id]) {
                    //根据索引查找
                    var cateItemsIndex = $('#J_carte_menu li').index($('#J_carte_menu .current'));
                    var itemListIndex = $('#J_carte_list li').index(el.parent());
                    item_data[id] = carte_data[_this.idPlus]['detailItems'].cateItems[cateItemsIndex].itemList[itemListIndex];
                    _this._renderPop(el, item_data[id]);
                }else{
                    _this._renderPop(el, item_data[id]);
                }
                /*dialog.show();
                 mask.show();*/

            },

            _renderPop: function (el, data) {
                var _this = this,
                    li = el.parents('li'),
                    plus_el = li.find('.plus'),
                    _itemPicUgcs = data.itemPicUgcs ? data.itemPicUgcs : [];

                data.width = window.document.body.clientWidth * 0.86 - 2;

                var options = {
                    data: data,
                    item: {
                        limit: plus_el.data('limit'),
                        quantity: plus_el.data('quantity'),
                        soldcount: plus_el.data('soldcount'),
                        count: parseInt(li.find('.J_carte_count').text()),
                        sku: plus_el.data('sku'),
                        itemid: data.itemId
                    }
                }

                var tpl = dd.ui.tmpl(tpl_cartepop.html(), options);

                dialog_content.html(tpl);
                this._popdialog.setTitle(data.itemName);
            },
            //菜单分量选择
            _carteOptions: function (el, isPop) {
                var _this = this,
                    role = el.data('role'),
                    carte_current = el.parents('li'),
                    carte_count = el.siblings('.J_carte_count');

                if(isPop) {
                    var pop_options = _this._popdialog.wrap.find('.J_pop_options'),
                        pop_add = _this._popdialog.wrap.find('.J_pop_add'),
                        pop_count = _this._popdialog.wrap.find('.J_carte_count');
                }

                //是否选择sku
                var sku_wrap;
                if (el.data('sku')) {
                    sku_wrap = el.parents('.sku_wrap');
                }

                //左侧菜单
                var menu_current = $('#J_carte_menu li.current'), //当前的菜单
                    menu_async; //同步数据的菜单,除虚拟类目外都等同于menu_current
                if (_this.flag) {
                    menu_async = $('#J_carte_menu_' + carte_current.data('item-cates'))
                } else {
                    menu_async = menu_current;
                }
                var menu_count = menu_async.find('.J_menu_count'); //菜单统计

                var mc = parseInt(menu_count.text()),
                    cc = parseInt(carte_count.text());

                if (role == 'plus') {
                    var limit = parseInt(el.data('limit')), //限购
                        quantity = parseInt(el.data('quantity')); //库存

                    //限购 外卖或预定0元菜
                    if (limit && cc >= limit) {
                        dd.ui.toast('限点' + limit + '份哦');
                        return;
                    }

                    //外卖库存
                    if (cc >= quantity) {
                        dd.ui.toast('没有库存啦');
                        return
                    }

                    cc++;
                    el.siblings().removeClass('dn');
                    carte_count.text(cc);

                    if(isPop) {
                        pop_count.text(cc);
                    }

                    if (cc == 1) {
                        mc++;
                        menu_count.text(mc).removeClass('dn');
                    }

                } else {
                    cc--;
                    carte_count.text(cc);

                    if(isPop) {
                        pop_count.text(cc);
                    }

                    if (cc <= 0) {
                        el.addClass('dn').siblings('.J_carte_count').addClass('dn');

                        //
                        mc--;
                        menu_count.text(mc);
                        mc == 0 && menu_count.addClass('dn');

                        if(isPop) {
                            pop_options.hide();
                            pop_add.show();
                        }
                    }
                }

                this._optionStorage(menu_current, menu_async, carte_current, sku_wrap, cc);

            },
            //分量存储
            _optionStorage: function (menu_el, async_el, carte_el, sku_wrap, cc) {
                var _this = this;
                var menu_index = menu_el.index(),
                    carte_index = carte_el.index(),
                    menu_data = carte_data[this.idPlus]['detailItems']['cateItems'][menu_index], //菜单列表
                    item_data = menu_data['itemList'][carte_index]; //菜品列表

                var _item_data;

                var data;
                if (_this.fromItg) {
                    //智能点菜
                    data = inorder_data[this.idPlus]['itg']
                } else {
                    //点菜
                    data = inorder_data[this.idPlus]['carte']
                }

                var //nid = (carte_el.data('item-cates') || menu_el.data('id')) + '_' + carte_el.data('id'), //正常id组合
                    nid = carte_el.data('id'),
                    vid = menu_data.flag && nid; //虚拟id组合

                if (sku_wrap) {
                    //加入skuid
                    nid = nid + '_' + sku_wrap.data('skuid');
                    vid = vid && vid + '_' + sku_wrap.data('skuid');

                    _item_data = item_data.sku[sku_wrap.index()];
                    _item_data.itemId = item_data.itemId
                } else {
                    _item_data = item_data;
                }

                if (cc) {
                    data/*.n*/[nid] = _item_data
                    data/*.n*/[nid].inOrder = cc;

                    //虚拟类目订单
                    /*if (vid) {
                     data.v[vid] = _item_data
                     data.v[vid].inOrder = cc;
                     }*/
                } else {
                    delete data/*.n*/[nid];
                    /*if (vid) {
                     delete data.v[vid];
                     }*/
                }

                dd.lib.localStorage.set('inorder_data', inorder_data);

                this._inOrderTotal(inorder_data[this.idPlus]);
            },
            //订单统计
            _inOrderTotal: function (data) {
                if (!data) {
                    return;
                }

                var _this = this, _data, total = 0, p = 0, discountPrice = 0,
                    low_money = carte_data[_this.idPlus].detailItems.reserveLowMoney,
                    takeoutMinimumAmount = carte_data[_this.idPlus].detailItems.takeoutMinimumAmount; //外卖起送金额

                takeoutMinimumAmount = takeoutMinimumAmount && +takeoutMinimumAmount > 0 ? takeoutMinimumAmount : null;

                if (_this.fromItg) {
                    //智能点菜
                    _data = data['itg'];
                } else {
                    //点菜 外卖
                    _data = data['carte'];//
                }

                $.each(_data/*.n*/, function (k, v) {
                    total += v.inOrder;
                    var resDiscount = parseFloat(v.resDiscount || 0), //折扣
                        oriPrice = parseFloat(v.oriPrice || 0), //原价
                        resDiscountMoney = parseFloat(v.resDiscountMoney || 0), //折后价
                        itemPrice = parseFloat(v.itemPrice || 0), //价格
                        reserveSkuDiscount = parseFloat(v.reserveSkuDiscount || 0), //sku折扣
                        reserveDisSkuPrice = parseFloat(v.reserveDisSkuPrice || 0), //sku折后价
                        skuPrice = parseFloat(v.skuPrice || 0); //sku价格

                    p += v.inOrder * ( v.skuId ? skuPrice : oriPrice );

                    //来自我的订单-修改，无以下字段
                    //if (v.resDiscountMoney || v.itemPrice) {console.log(v.itemPrice || v.price)
                    discountPrice += v.inOrder * ( v.skuId ?
                        ( reserveSkuDiscount ? reserveDisSkuPrice : skuPrice ) :
                        ( resDiscount ? resDiscountMoney : itemPrice ) );
                });

                discountPrice = dd.lib.num2Fixed(discountPrice)

                //最低预定金额限制
                if (low_money || takeoutMinimumAmount) {
                    var min_p = low_money || takeoutMinimumAmount,
                        min_text = low_money ? '起订金额还差￥%price%元' : '还差%price%起送';
                    var difference = dd.lib.num2Fixed(Number(low_money || takeoutMinimumAmount) - discountPrice);
                    if (difference > 0 && discountPrice >= 0) {
                        carte_sub_save.hide();
                        reserve_difference.show().text(min_text.replace('%price%', difference));
                    }
                    else {
                        carte_sub_save.show();
                        reserve_difference.hide();
                    }
                } else {
                    carte_sub_save.show();
                }

                if (!total) {
                    bottom_tip.hide();
                    carte_sub.addClass(CLS_DISABLE);
                } else {
                    bottom_tip.show();
                    p = dd.lib.num2Fixed(p);

                    //如果有折扣，分别展示折扣前后的价格
                    var price_text = (discountPrice >= 0 && (discountPrice !== p)) ? '￥' + discountPrice + '<span class="price_ori">￥' + p + '</span>' : '￥' + p;

                    setTimeout(function () {
                        order_count.html('共计' + total + '个菜，' + price_text).show();
                    }, 50);
                    carte_sub.removeClass(CLS_DISABLE);

                    itg_data && (itg_data.totalPrice = p);
                }
            },
            //滚动初始化
            _iScrollInit: function () {
                menuScroll && (menuScroll.destroy() || (menuScroll = null));
                listScroll && (listScroll.destroy() || (listScroll = null));
            }
        }
    }

    dd.app.Carte = function () {
        return new Carte;
    };
})(Zepto, window, window['dd']);

/**
 * @Descript: H5页面-订单确认
 */
(function($, window, dd) {
    var bridge = window.bridge;
    var carte_check_wrap = $('#J_carte_check');

    //script模板
    var tpl_carte_check = $('#J_tpl_carte_check');

    var carte_check_count,
        order_count,
        carte_check_save

    var carte_check_np,
        carte_check_tel,
        carte_check_ps;

    var inorder_data // = dd.lib.localStorage.get('inorder_data'); //下单总计数据

    var History = window.History;

    function CarteCheck() {
        return {
            wrap: $('#J_carte_check'),
            init: function(arg1, arg2) {
                var _this = this;
                _this.id = arg1;

                _this.orderId = undefined;
                _this.optionType = 'diandefault';

                if (/dianadd|dianmod/.test(arg2)) {
                    //增加 | 修改
                    _this.orderId = arg2.split('_')[1];
                    _this.optionType = arg2.split('_')[0];
                }

                inorder_data = dd.lib.localStorage.get('inorder_data') || {}; //下单总计数据

                _this.initHandler();
            },
            initHandler: function() {
                this._renderStatic();
            },
            setAfterPageIn: function() {
                var _this = this;

                _this._iScrollInit();

                // if (dd.device.nativeScroll) {
                //     $('#J_carte_check_scroll')[0].scrollTop = 1;
                // }
            },
            setAfterPageOut: function() {
                carte_check_count = null;
                order_count = null;
                carte_check_save = null;

                carte_check_np = null;
                carte_check_tel = null;
                carte_check_ps = null;
                inorder_data = null;
                /*$(window).off('resize.cartecheck');*/
            },
            setBeforePageOut: function() {
                carte_check_tel && dd.lib.memCache.set('dian_tel', carte_check_tel.val());
                carte_check_ps && dd.lib.memCache.set('dian_ps', carte_check_ps.val());
                document.activeElement.blur();
            },
            //静态模板
            _renderStatic: function() {
                var _this = this;
                _this.buildTmpl();
            },
            buildTmpl: function() {
                var _this = this;

                _this.State = History.getState();
                _this.referer = _this.State.data.referer || '';
                _this.num = _this.State.data.num || '';
                _this.cartViewList = _this.State.data.data.cartViewList;

                //var carte_data = _this.State.data.data;

                //var localstoreStatus = _detail_items_data['localstoreStatus'];

                var options = _this.State.data;
                options.tel = dd.lib.memCache.get('dian_tel') || '';
                options.ps = dd.lib.memCache.get('dian_ps') || '';
                options.alt = _this.referer || 'carte/dian/' + _this.id;

                //渲染
                var tpl = dd.ui.tmpl(tpl_carte_check.html(), options);
                dd.ui.toast.hide();
                _this.startUp(tpl);

                carte_check_count = $('#J_carte_check_count');
                carte_check_save = $('#J_carte_check_save');

                carte_check_np = $('#J_carte_check_np');
                carte_check_tel = $('#J_carte_check_tel');
                carte_check_ps = $('#J_carte_check_ps');

                _this._manualHandler();
            },
            startUp: function(tpl) {
                carte_check_wrap.html(tpl);
            },
            events: [
                [dd.event.click, '.J_carte_options', '_optionsHandler'],
                [dd.event.click, '#J_carte_check_save', '_checkSaveHandler'],
                [dd.event.click, 'input', '_inputFocusHandler'],
                ['blur', 'input', '_inputBlurHandler'],
                ['touchstart', '#J_carte_check_scroll', '_scrollTouchHandler']
            ],
            _scrollTouchHandler: function() {
                if (dd.device.isAndroid && dd.device.nativeScroll) {
                    document.activeElement.blur();
                }
            },
            _optionsHandler: function(e, el) {
                var _this = this;
                if (_this.async) {
                    return;
                }
                _this.async = true;
                _this._carteOptions($(el));
            },
            //保存订单
            _checkSaveHandler: function(e, el) {
                var _this = this;
                var telv = $.trim(carte_check_tel.val());
                if (_this._validPhone(telv)) {

                    var orderOption = parseInt(_this.State.data.data.orderOption),
                        orderExtraId = parseInt(_this.State.data.data.orderExtraId);
                    if(orderOption == 2 && orderExtraId && _this.optionType !== 'dianadd') {
                        //重复下单判断
                        bridge.push('confirm', {
                            title: '',
                            message: '您在本店已经下过单！',
                            okButton: '我要加菜',
                            cancelButton: '另下一单'
                        }, function(result) {
                            if (result.ok) {
                                //加菜
                                _this.orderId = orderExtraId;
                                _this.optionType = 'dianadd';
                            }
                            _this._saveRequireOptionCart(telv);
                        });
                    }else{
                        _this._saveRequireOptionCart(telv);
                    }

                }
            },
            _saveRequireOptionCart: function(telv){
                var _this = this;
                _this._requirOptionCart({
                    'infos': _this._inOrderTotal(),
                    'o': 2,
                    'phone': telv,
                    'num': carte_check_np.val() ? carte_check_np.val() : null,
                    'note': carte_check_ps.val()
                }, _this._orderSaveCallback);
            },
            _inputFocusHandler: function(e, el) {
                var _this = this;
                var $el = $(el);
                /*if(dd.device.isAndroid && dd.device.nativeScroll) {
					var check_scroll = $('#J_carte_check_scroll');
					check_scroll.css('overflow','hidden');
					setTimeout(function(){
						var st = check_scroll[0].scrollTop;
						check_scroll[0].scrollTop = st+$el.offset().top;
					},200)
					
				}*/

                /*if(dd.device.isAndroid && !dd.device.nativeScroll) {
					setTimeout(function(){
						$el.addClass('onfocus');
					},50)
				}*/
            },
            _inputBlurHandler: function(e, el) {
                /*if(dd.device.isAndroid && dd.device.nativeScroll) {
					$('#J_carte_check_scroll').css('overflow','auto');
				}*/

                /*if(dd.device.isAndroid && !dd.device.nativeScroll) {
					$(el).removeClass('onfocus');
				}*/
            },
            //渲染后业务
            _manualHandler: function() {
                var _this = this;
                _this._carteUpdate(_this.State.data.data, 'init');
                //dd.ui.bottom.switchTo('check', History.getState().data.referer || 'carte/'+_this.id);
            },
            //验证电话
            _validPhone: function(v) {
                if (!v) {
                    dd.ui.toast('请输入手机号');
                    return
                }

                if (v > 13000000000 && v < 19000000000) {
                    return true;
                } else {
                    dd.ui.toast('请输入正确的手机号码！');
                }
            },
            //订单保存成功回调
            _orderSaveCallback: function(data) {
                var _this = this;
                //重置订单数据标识
                //dd.lib.memCache.set('reset_carte', true);
                //所有页面重置标识
                $('#J_page').children().removeAttr('data-ddid');
                dd.lib.memCache.set('checkoption', true);

                setTimeout(function() {
                    //setBeforePageOut 之后
                    dd.lib.memCache.removeValue('dian_ps');
                }, 500);

                var push_ddid = 'my_order_details/' + data.extraOrderId
                var state_obj = {
                    'replace': {
                        'ddid': push_ddid
                    }
                };
                //清空菜单
                delete inorder_data[_this.id];
                dd.lib.localStorage.set('inorder_data', inorder_data);

                var serviceType = data.serviceType,
                    serveType = data.serveType; //当前店铺的类型

                

                if(serveType !== dd.config.store.FRONT_PAY_SHOP_TYPE) {

                    if (serveType == dd.config.store.PAY_SHOP_TYPE_HIGH) {
                        //高级版

                        if(_this.optionType == 'dianadd') {
                            //加菜
                            dd.lib.memCache.set('confirmType', 5);
                            dd.lib.ddState(state_obj)
                        }else{
                            bridge.push('confirm', {
                                title: '菜单已保存',
                                message: '下单前请您确保已到店入座',
                                okButton: '已到店，现在下单',
                                cancelButton: '未到店，待会下单'
                            }, function(result) {
                                if (result.ok) {
                                    //下单
                                    dd.lib.memCache.set('confirmType', 1);
                                }else{
                                    dd.lib.memCache.set('confirmType', 4);
                                }
                                dd.lib.ddState(state_obj)
                            });
                        }
                        
                    }else{
                        if (serviceType == dd.config.order.service_type_base || serviceType == dd.config.order.service_type_advance) {
                            // 基础班 高级版
                            bridge.push('confirm', {
                                title: '菜单已保存',
                                message: '如果您已到店，请扫码下单！',
                                okButton: '已到店，扫码下单',
                                cancelButton: '未到店，待会下单'
                            }, function(result) {
                                if (result.ok) {
                                    //下单
                                    dd.lib.memCache.set('confirmType', 1);
                                }else{
                                    dd.lib.memCache.set('confirmType', 4);
                                }
                                dd.lib.ddState(state_obj)
                            });
                        }else if(serviceType == dd.config.order.service_type_frontpay) {
                            //前支付
                            bridge.push('confirm', {
                                title: '菜单已保存',
                                message: '扫码支付，坐等商家上菜哦！',
                                okButton: '扫码支付',
                                cancelButton: '暂不支付'
                            }, function(result) {
                                if (result.ok) {
                                    //支付
                                    dd.lib.memCache.set('confirmType', 1);
                                }else{
                                    dd.lib.memCache.set('confirmType', 8);
                                }
                                dd.lib.ddState(state_obj)
                            });
                        
                        }
                    }
                    
                } else if (serveType == dd.config.store.FRONT_PAY_SHOP_TYPE) {
                    // 客户端逻辑
                    dd.lib.ddState({
                        'replace': {
                            'ddid': 'my'
                        }
                    });
                }
            },
            //菜单分量选择
            _carteOptions: function(el) {
                var _this = this;
                var role = el.data('role'),
                    carte_current = el.parents('li'),
                    carte_count = el.siblings('.J_carte_count'),
                    skuid = parseInt(carte_current.data('skuid'));

                _this.itemDelIndex = undefined;


                var cc = parseInt(carte_count.text());
                var //idplus = carte_current.attr('data-catid')+'_'+carte_current.attr('data-id');
                idplus = carte_current.data('id');

                if (role == 'plus') {

                    //点菜不需要判断库存并且没有0元菜的限购
                    /*if (cc >= 9999) {
                        dd.ui.toast('最大只能购买24份');
                        _this.async = false;
                        return;
                    }*/
                    
                    cc++;
                    el.siblings().removeClass('dn');
                    _this.abc = idplus + (skuid ? '_' + skuid : '') + '__' + cc;

                    carte_current && carte_current.attr('data-inorder', cc);
                    _this._optionStorage(carte_current, cc);
                } else {
                    cc--;
                    _this.abc = idplus + (skuid ? '_' + skuid : '') + '__' + cc;
                    if (cc <= 0) {
                        //el.addClass('dn').siblings('.J_carte_count').addClass('dn');

                        bridge.push('confirm', {
                            title: '',
                            message: '您确定要删除' + carte_current.find('.name').text() + '吗？',
                            okButton: '确定',
                            cancelButton: '取消'
                        }, function (result) {
                            if(result.ok) {
                                _this.cartViewList.splice(carte_current.index(), 1);
                                carte_current.remove();
                                carte_current = undefined;
                                _this._scroll.refresh();
                                _this._updateCarteCache()

                                carte_current && carte_current.attr('data-inorder', cc);
                                _this._optionStorage(carte_current, cc);
                            }else{
                                _this.async = false;
                            }
                        });

                    }else{
                        carte_current && carte_current.attr('data-inorder', cc);
                        _this._optionStorage(carte_current, cc);
                    }
                }

            },
            _optionStorage: function(carte_current, cc) {
                var _this = this;

                if (carte_current) {
                    var carte_index = this.carte_index = carte_current.index(),
                        state_carte = this.cartViewList[carte_index];

                    state_carte.quantity = cc;
                } else {
                    this.carte_index = undefined;
                }

                //清空
                if (!_this.cartViewList.length) {
                    dd.lib.ddState({
                        'back': {
                            'ddid': 'carte/dian/' + _this.id
                        }
                    })
                    _this.async = false;
                    return
                }

                _this._requirOptionCart({
                    'infos': _this._inOrderTotal(),
                    'o': 0
                }, _this._carteUpdate);
                //carte_current.remove();
            },
            //订单统计
            _inOrderTotal: function() {
                var _this = this;

                var data = _this.cartViewList,
                    info_arr = [];

                $.each(data, function(k, v) {
                    info_arr.push(v.itemId + ':' + (parseInt(v.skuId) ? v.skuId : '') + ':' + v.quantity);
                });

                return info_arr;
            },
            //获取新的购物车
            _requirOptionCart: function(options, callback) {
                var _this = this;
                dd.ui.toast.loading();

                lib.mtop.request({
                    api: 'mtop.life.diandian.optionCart',
                    v: '1.0',
                    data: {
                        'storeId': _this.id,
                        'o': options.o,
                        'info': options.infos.join(';'),
                        'bizLine': 0,
                        'phone': options.phone,
                        'num': options.num,
                        'note': options.note, //备注
                        't': Date.parse(new Date()).toString(),
                        'orderOption': dd.config.optioncart[_this.optionType],
                        'orderId': _this.orderId,
                        'platform': dd.mtop_platform
                    }
                }, function(data) {
                    dd.ui.toast.hide();
                    if (data.data) {
                        callback && callback.call(_this, data.data);
                    }
                    _this.async = false;
                    dd.ui.toast.hide();
                }, function(data) {
                    dd.ui.toast(data);
                    _this.async = false;
                });
            },
            //列表数据更新
            _carteUpdate: function(data, from) {
                var _this = this;

                if (from !== 'init') {
                    if (_this.carte_index >= 0) {
                        var list = data.cartViewList[this.carte_index];
                        var li = $('#J_carte_check_list li').eq(this.carte_index);

                        li.find('.J_carte_count').text(list.quantity);
                        li.find('.J_total_price').text(parseInt(list.price) / 100);

                        li.find('.price').html('&yen;<span>' + parseInt(list.totalPriceLow) / 100 + '</span>');
                    }

                    var v = dd.lib.getUriParam(this.State.url, '_ddid');
                    History.replaceState({
                        'page': 'carte_check',
                        'uri': v,
                        'data': data,
                        'referer': _this.referer,
                        'num': _this.num
                    }, '淘点点', '?_ddid=' + v + dd.config.url_track);
                }

                carte_check_count.text(_this._countTotal(data.cartViewList) + '个菜，' + parseInt(data.price) / 100 + '元');

                _this._updateCarteCache()
            },
            _countTotal: function(list) {
                var t = 0;
                $.each(list, function(k, v) {
                    t += parseInt(v.quantity);
                });
                return t;
            },
            _updateCarteCache: function() {
                var _this = this;
                var abc = _this.abc;

                if (!abc || !inorder_data) {
                    return
                }
                var arr = abc.split('__'); //[arr[0]]
                var item_data = inorder_data[_this.id]['carte'], //更新点菜数据
                    n_data = item_data /*.n*/ [arr[0]]
                    /*, //正常类目数据
					v_data = item_data.v[arr[0]]; //虚拟类目数据*/

                if (n_data) {
                    if (parseInt(arr[1]) === 0) {
                        delete item_data /*.n*/ [arr[0]]
                    } else {
                        n_data.inOrder = parseInt(arr[1]);
                    }
                }

                /*if(v_data) {
					if(parseInt(arr[1]) === 0) {
						delete item_data.v[arr[0]];
					}else{
						v_data.inOrder = parseInt(arr[1]);
					}
				}*/

                dd.lib.localStorage.set('inorder_data', inorder_data);
            },
            //滚动初始化
            _iScrollInit: function() {
                var _this = this;

                this._scroll = dd.ui._scroll({
                    'wrap': '#J_carte_check_scroll'
                })
                /*if(dd.device.isAndroid && !dd.device.nativeScroll) {
					_this.mainScroll && _this.mainScroll.on('refresh', function () {
						//resizePolling 默认60
						setTimeout(function(){
							_this._scrollToEl();
						},70)
					});
				}*/
            }
            /*,
			_scrollToEl: function(){
				var _this = this;
				var focus_el = $('input.onfocus');
				if(focus_el.length) {
					_this.mainScroll.scrollToElement(focus_el[0])
					focus_el.removeClass('onfocus');
				}
			}*/
        }
    }

    dd.app.CarteCheck = function() {
        return new CarteCheck;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-外卖订单确认
 */
(function ($, window, doc) {
    //提示
    var carte_checkdelivery_panel = $('#J_carte_checkdelivery'),
        tpl_carte_checkdelivery = $('#J_tpl_carte_checkdelivery'),
        tpl_carte_checkdelivery_content = $('#J_tpl_carte_checkdelivery_content');

    var carte_checkdelivery_content,
        carte_check_count;

    //存储访问过的店铺
    var inorder_data; // = dd.lib.memCache.get('inorder_data'); //下单总计数据

    var History = window.History,
        bridge = window.bridge;

    function CarteCheckDelivery() {
        return {
            wrap: carte_checkdelivery_panel,
            init: function (arg1) {
                var _this = this;

                _this.id = '';
                _this.shopid = arg1;
                _this.payType = '0';

                _this.date_change = false;

                _this.State = History.getState();

                inorder_data = dd.lib.localStorage.get('inorder_data') || {}; //下单总计数据

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function () {
                var _this = this;
                //判断更新地址
                if (dd.lib.memCache.get('update_checkdelivery_address')) {
                    //_this.address = JSON.parse(storage.dd_delivery_address)

                    var v = 'carte_checkdelivery/' + _this.shopid;
                    //刷新&不存在地址

                    History.replaceState({
                        'default_address': dd.lib.localStorage.get('default_address')
,
                        'referer': _this.State.data.referer,
                        'data': _this.State.data.data
                    }, '淘点点', '?_ddid=' + v + dd.config.url_track);

                    _this.address = dd.lib.localStorage.get('default_address')
;

                    inorder_data = dd.lib.localStorage.get('inorder_data') || {};

                    _this._buildTmpl();

                    //销毁
                    dd.lib.memCache.removeValue('update_checkdelivery_address')
                }

                //after call input
                /* $(window).on('resize.cartecheckdelivery', function() {
                 _this.mainScroll && _this.mainScroll.refresh();
                 });*/
            },
            setAfterPageOut: function () {
                // 不知为何添加
                //carte_checkdelivery_content = null;
                inorder_data = null;
                //carte_check_count = null;
                //$(window).off('resize.cartecheckdelivery');
            },

            setBeforePageOut: function () {
                document.activeElement.blur();
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_carte_checkdelivery.html(), {});
                carte_checkdelivery_panel.html(tpl);

                //loading
                carte_checkdelivery_content = carte_checkdelivery_panel.find('#J_carte_checkdelivery_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;

                _this.address = dd.lib.localStorage.get('default_address')
; //地址数据

                if (!_this.address) {
                    //抓默认地址
                    _this._getDefaultAddress();
                } else {
                    _this._buildTmpl();
                }
            },
            _getDefaultAddress: function () {
                //查询默认地址
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.getDefaultUserAddressById',
                    v: '1.0',
                    data: {},
                    extParam: {}
                }, function (data) {
                    if (data.data) {

                        //_this._buildTmpl(data.data);
                        //var  state = History.getState();
                        //var v = 'delivery/'+data.data.model.id;//console.log(v)
                        var v = 'carte_checkdelivery/' + _this.id + '/' + _this.shopid;
                        //刷新&不存在地址
                        /*History.replaceState({
                         'page': 'carte_checkdelivery',
                         'uri': v,
                         'default_address':data.data.model,
                         'data': _this.State.data.data,
                         'referer': _this.State.data.referer,
                         }, '淘点点', '?_ddid='+v);*/
                        dd.lib.localStorage.set('default_address', data.data.model)
                        _this._renderDynamic();
                    }
                }, function (data) {
                    //没有默认地址
                    dd.ui.toast('请选择送餐地址');
                    _this.address = {
                        id: 0
                    }
                    _this._switchAddressHandler();
                });
            },
            _buildTmpl: function () {
                var _this = this;

                if (!_this.State.data.data) {
                    dd.lib.ddState({
                        'back': {
                            'ddid': 'carte/delivery/' + this.shopid
                        }
                    });
                    return
                }
                _this.cartViewList = _this.State.data.data.cartViewList;
                console.log(_this.State.data.data)

                var carte_data = _this.State.data;

                carte_data['addressData'] = _this.address;

                var options = {
                    'data': carte_data.data,
                    'alt': _this.State.data.referer || 'carte/delivery/' + _this.shopid
                }

                //渲染
                var tpl = dd.ui.tmpl(tpl_carte_checkdelivery_content.html(), options);
                _this.startUp(tpl);

                _this._buildHeadTpl();

                carte_check_count = $('#J_carte_checkdelivery_count');

                _this._iScrollInit();
                _this._getDeliveryDate();

                if(_this.State.data.data.voucherVOList.length) {
                    _this._showCouponSelect();
                }
            },
            _showCouponSelect: function(){
                var tpl = '<li class="J_coupon_item<%=data.selected ? " selected":""%><%=data.itemStatus=="0"?" disabled":""%>"<%=data.selected ? " selected=true":""%>><i></i><%=data.title%><%=data.itemStatus=="0"?"<span>暂无库存</span>":""%></li>',tplarr = [];
                $.each(this.State.data.data.voucherVOList, function(k, v){
                    tplarr.push(dd.ui.tmpl(tpl, {data:v}));
                });

                this._popDialog = dd.ui.dialog({
                    'cls': 'carte_dialog',
                    'title': '我的兑换券',
                    'wrap': '#J_carte_checkdelivery',
                    'content': '<ul class="pop_my_coupon">'+ tplarr.join('') +'</ul><div class="pop_my_coupon_bottom"><span id="J_shop_coupon_confirm" class="btn_bottom_sub">确定</span></div>',
                    'maxheight': '246'
                });
            },
            startUp: function (tpl) {
                carte_checkdelivery_content.html(tpl);
            },
            events: [
                [dd.event.click, '.J_switch_address', '_switchAddressHandler'],
                [dd.event.click, '.J_paytype', '_payTypeHandler'],
                [dd.event.click, '.J_carte_options', '_optionsHandler'],
                [dd.event.click, '#J_carte_checkdelivery_save', '_saveHandler'],
                ['change', '#J_delivery_select_date', '_selectDateHandler'],
                ['focus', '#J_delivery_select_time', '_selectTimeHandler'],
                [dd.event.click, '#J_carte_checkdelivery_note', '_noteFocusHandler'],
                ['blur', '#J_carte_checkdelivery_note', '_noteBlurHandler'],
                ['touchmove', '#J_carte_checkdelivery_scroll', '_scrollTouchHandler'],
                [dd.event.click, '#J_shop_coupon_btn', '_shopCouponBtnHandler'],
                [dd.event.click, '.J_coupon_item', '_shopCouponItemHandler'],
                [dd.event.click, '#J_shop_coupon_confirm', '_shopCouponConfirmHandler']
            ],
            _scrollTouchHandler: function () {
                if (dd.device.isAndroid && dd.device.nativeScroll) {
                    document.activeElement.blur();
                }
            },
            _switchAddressHandler: function (e, el) {
                var state_obj = {
                    'push': {
                        'ddid': 'address/' + this.address.id + '/checkdelivery',
                        'obj': {
                            'referer': 'carte_checkdelivery/' + this.shopid
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },
            _payTypeHandler: function (e, el) {
                $(el).addClass('current').siblings().removeClass('current');
                this.payType = $(el).attr('data-id');
            },
            _optionsHandler: function (e, el) {
                if (this.async) {
                    return;
                }
                this.async = true;
                this._carteOptions($(el));
            },
            //下单
            _saveHandler: function (e, el) {
                var _this = this;
                bridge.push('confirm', {
                    title: '',
                    message: '请确认送餐时间：' + $('#J_delivery_select_date').val() + ' ' + $('#J_delivery_select_time').val(),
                    okButton: '确定',
                    cancelButton: '取消'
                }, function (result) {
                    if(result.ok) {
                        _this._inOrderTotal(2);
                        //准备刷新我的外卖列表
                        //因为订单状态将发生变化
                        $('#J_my_delivery').removeAttr('data-ddid');
                    }
                });
            },
            _selectDateHandler: function (e, el) {
                var $el = $(el)

                this.date_change = true;
                this._getDeliveryTime($el.val());
            },
            _selectTimeHandler: function (e, el) {
                if (this.date_change) {
                    //ios select内容不更新
                    document.activeElement.blur();
                    $(el).hide();
                }
            },
            _noteFocusHandler: function (e, el) {
                var _this = this;
                var $el = $(el);

                /*if(dd.device.isAndroid && dd.device.nativeScroll) {
                 var checkdelivery_scroll = $('#J_carte_checkdelivery_scroll');
                 checkdelivery_scroll.css('overflow','hidden');
                 setTimeout(function(){
                 var st = checkdelivery_scroll[0].scrollTop;
                 checkdelivery_scroll[0].scrollTop = st+$el.offset().top-50;
                 },200)

                 }

                 if(dd.device.isAndroid && !dd.device.nativeScroll) {
                 setTimeout(function() {
                 $el.addClass('onfocus');
                 }, 50)
                 }*/
            },
            _noteBlurHandler: function (e, el) {
                /*if(dd.device.isAndroid && dd.device.nativeScroll) {
                 $('#J_carte_checkdelivery_scroll').css('overflow','auto');
                 }

                 if(dd.device.isAndroid && !dd.device.nativeScroll) {
                 $(el).removeClass('onfocus');
                 }*/
            },
            //显示券
            _shopCouponBtnHandler: function(){
                this._showCouponSelect();
            },
            //选择券
            _shopCouponItemHandler: function(e, el){
                var $el = $(el);
                if($el.hasClass('disabled')) {
                    return
                }

                var coupons = this.State.data.data.voucherVOList,
                    coupon_item = coupons[$el.index()];

                if($el.attr('selected')) {
                    $el.removeAttr('selected').removeClass('selected');
                }else{
                    $el.attr('selected', 'true').addClass('selected');
                }
            },
            //提交券
            _shopCouponConfirmHandler: function(){
                var coupons = this.State.data.data.voucherVOList;

                //记录选中
                this.wrap.find('.J_coupon_item ').each(function(k, v){
                    var item = $(v),
                        coupon_item = coupons[item.index()];

                    if(item.attr('selected')) {
                        coupon_item.selected = true;
                    }else{
                        delete coupon_item.selected;
                    }
                });

                this._popDialog.hide();
                this._buildCoupon();
            },
            //券菜品
            _buildCoupon: function(){
                var tpl = '<li data-id="<%=itemId%>">'+
                            '<div class="pic"><div class="img" <%if(picUrlHttp){%>style="background-image:url(<%=picUrlHttp%>_72x72xz.jpg<%=dd.lib.imgSuffix%>)"<%}%>></div></div>'+
                            '<div class="items_wrap">'+
                                '<div class="name"><%=itemName%> <span class="shoplist_type_quan">兑</span></div>'+
                                '<div class="details">'+
                                    '<p class="price">￥<span><%=parseInt(totalPriceLow)/100%></span></p>'+
                                '</div>'+
                            '</div>'+
                        '</li>';
                var tplarr = [];
                $.each(this.State.data.data.voucherVOList, function(k, v){
                    if(v.selected) {
                        tplarr.push( dd.ui.tmpl( tpl, v.relatedItemDO[0] ) );
                    }
                });

                if(tplarr.length) {
                    $('#J_carte_checkdelivery_coupon_item_list').html(tplarr.join('')).show();
                }else{
                    $('#J_carte_checkdelivery_coupon_item_list').html('').hide();
                }
            },
            _buildHeadTpl: function (data) {
                //渲染头部地址
                var _this = this;
                var tpl = dd.ui.tmpl($('#J_tpl_carte_checkdelivery_head').html(), {'data': _this.address || {}});
                $('#J_carte_checkdelivery_head').html(tpl);
            },
            _getDeliveryDate: function () {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.deliveryDate',
                    v: '1.0',
                    data: {
                        'shopId': _this.shopid
                    },
                    extParam: {}
                }, function (data) {
                    dd.ui.toast.hide();
                    if (data.data) {
                        var arr = [];
                        $.each(data.data.result, function (k, v) {
                            arr.push('<option value="' + v + '">' + v + '</option>');
                        });
                        $('#J_delivery_select_date').html(arr.join(''));

                        _this._getDeliveryTime($('#J_delivery_select_date').val());
                    }
                    _this.async = false;
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false;
                });
            },

            _getDeliveryTime: function (date) {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.deliveryTime',
                    v: '1.0',
                    data: {
                        'shopId': _this.shopid,
                        'date': date,
                        'selectIndex': 0
                    },
                    extParam: {}
                }, function (data) {
                    dd.ui.toast.hide();
                    if (data.data) {
                        var arr = [];
                        $.each(data.data.timeSection, function (k, v) {
                            arr.push('<option value="' + v + '">' + v + '</option>');
                        });
                        $('#J_delivery_select_time').html(arr.join('')).show();

                        _this.date_change = false;
                    }
                    _this.async = false;
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false;
                });
            },
            //菜单分量选择
            _carteOptions: function (el) {
                var _this = this;
                var role = el.data('role'),
                    carte_current = el.parents('li'),
                    carte_count = el.siblings('.J_carte_count'),
                    skuid = parseInt(carte_current.data('skuid'));

                var cc = parseInt(carte_count.text());
                var idplus = carte_current.attr('data-id');

                if (role == 'plus') {
                    var limit = parseInt(carte_current.data('limit')),
                        usalamount = parseInt(carte_current.data('usalamount'));

                    //限购 外卖或预定0元菜
                    if (limit && cc >= limit) {
                        dd.ui.toast('限点'+ limit +'份哦');
                        _this.async = false;
                        return;
                    }

                    //外卖库存
                    if(cc >= usalamount) {
                        dd.ui.toast('没有库存啦');
                        _this.async = false;
                        return
                    }

                    cc++;
                    el.siblings().removeClass('dn');
                    _this.abc = idplus + (skuid ? '_' + skuid : '') + '__' + cc;

                    carte_current && carte_current.attr('data-inorder', cc);
                    _this._optionStorage(carte_current, cc);
                } else {
                    cc--;
                    _this.abc = idplus + (skuid ? '_' + skuid : '') + '__' + cc;
                    if (cc <= 0) {
                        //el.addClass('dn').siblings('.J_carte_count').addClass('dn');
                        bridge.push('confirm', {
                            title: '',
                            message: '您确定要删除' + carte_current.find('.name').text() + '吗？',
                            okButton: '确定',
                            cancelButton: '取消'
                        }, function (result) {
                            if(result.ok) {
                                _this.cartViewList.splice(carte_current.index(), 1);
                                carte_current.remove();
                                carte_current = undefined;
                                //_this.mainScroll.refresh();
                                _this._updateCarteCache()

                                carte_current && carte_current.attr('data-inorder', cc);
                                _this._optionStorage(carte_current, cc);
                            }else{
                                _this.async = false;
                            }
                        });

                    }else{
                        carte_current && carte_current.attr('data-inorder', cc);
                        _this._optionStorage(carte_current, cc);
                    }
                }

            },
            _optionStorage: function (carte_current, cc) {
                var _this = this;
                if (carte_current) {
                    var carte_index = this.carte_index = carte_current.index(),
                        state_carte = this.cartViewList[carte_index];

                    state_carte.quantity = cc;
                } else {
                    this.carte_index = undefined;
                }

                //清空
                if (!_this.cartViewList.length) {
                    dd.lib.ddState({
                        'back': {
                            'ddid': 'carte/delivery/' + _this.shopid
                        }
                    })
                    _this.async = false;
                    return
                }

                //console.log(item_data)
                this._inOrderTotal(0);
            },

            //订单统计
            _inOrderTotal: function (o) {
                var _this = this,
                    data = _this.cartViewList,
                    info_arr = [];

                $.each(data, function (k, v) {
                    info_arr.push(v.itemId + ':' + (parseInt(v.skuId) ? v.skuId : '') + ':' + v.quantity);
                });

                _this._requirOptionCart(o, info_arr);
            },
            //送的菜
            _getSongItems: function(){
                var arr = [],
                    freeItemList = this.State.data.data.freeItemList;
                if(freeItemList && freeItemList.length) {
                    $.each(freeItemList, function(k, v){
                        arr.push(v.itemId+':'+v.skuId+':0');
                    });
                }
                return arr.join(';');
            },
            //核销券
            _getVoucherIds: function(){
                var arr = [],
                    voucherVOList = this.State.data.data.voucherVOList;
                if(voucherVOList && voucherVOList.length) {
                    $.each(voucherVOList, function(k, v){
                        if(v.selected) {
                            arr.push(v.id);
                        }
                        
                    });
                }
                return arr.join(';');
            },
            //获取新的购物车
            _requirOptionCart: function (o, info_arr) {
                var _this = this;

                dd.ui.toast.loading();
                lib.mtop.request({
                    api: 'mtop.life.diandian.optionCart',
                    v: '1.0',
                    data: {
                        'storeId': _this.shopid,
                        'o': o,
                        'info': info_arr.join(';'),
                        'songItems': _this._getSongItems(),
                        'voucherIds': _this._getVoucherIds(),
                        'addressId': _this.address.id,
                        'time': $('#J_delivery_select_date').val() + ' ' + $('#J_delivery_select_time').val(), //yyyy-MM-dd HH:mm
                        'payType': parseInt(_this.payType),
                        'bizLine': 1,
                        'note': $('#J_carte_checkdelivery_note').val(),
                        'platform': dd.mtop_platform
                    },
                    extParam: {}
                }, function (data) {
                    dd.ui.toast.hide();
                    if (data.data) {
                        if (o == 0) {
                            _this._carteUpdate(data.data);
                            _this.async = false;
                        } else if (o == 2) {
                            _this._orderHandler(data.data);
                        }
                    }
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false;
                });
            },
            _orderHandler: function (data) {
                var _this = this;

                if (data.bizOrderId) {
                    delete inorder_data[_this.shopid];
                    dd.lib.localStorage.set('inorder_data', inorder_data);

                    if (data.alipayStreamId) {
                        //支付
                        _this._doPay(data);
                    } else {
                        //货到付款
                        _this._deliveryDetail(data.bizOrderId)
                    }
                }
            },
            //免登支付
            _doPay: function (data) {
                var _this = this;

                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        "tradeNO": data.alipayStreamId
                    }, function (result) {
                        dd.ui.toast.hide();
                        dd.lib.ddState({
                            'replace': {
                                'ddid': 'my_delivery_details/' + data.bizOrderId
                            }
                        });
                        _this.async = false;
                    })
                }
                else {
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': data.bizOrderId,
                            'payType': 0
                        }
                    }, function (payData) {
                        if (payData.data.canPay == 'true') {
                            if (dd.device.isAndroid && dd.device.version.android < 4) {
                                location.href = payData.data.alipayUrl;
                                return;
                            }
                            dd.ui.alipay({
                                'title': '支付',
                                'alipayUrl': payData.data.alipayUrl,
                                'successFunc': function () {
                                    //所有页面重置标识
                                    //$('#J_page').children().removeAttr('data-ddid');
                                    dd.lib.ddState({
                                        'replace': {
                                            'ddid': 'my_delivery_details/' + data.bizOrderId
                                        }
                                    });
                                }
                            });
                        }
                        _this.async = false;
                        dd.ui.toast.hide();

                    }, function (data) {
                        _this.async = false;
                        dd.ui.toast.hide();
                    });
                }
            },
            //货到付款
            _deliveryDetail: function (id) {
                //所有页面重置标识
                $('#J_page').children().removeAttr('data-ddid');

                var ddid = 'my_delivery_details/' + id;
                var state_obj = {
                    'replace': {
                        'ddid': ddid
                    }
                };
                dd.lib.ddState(state_obj);
            },
            //列表数据更新
            _carteUpdate: function (data) {
                var _this = this;

                if (_this.carte_index >= 0) {
                    var list = data.cartViewList[this.carte_index];
                    var li = $('#J_carte_checkdelivery_list li').eq(this.carte_index);

                    li.find('.J_carte_count').text(list.quantity);
                    li.find('.J_total_price').text(parseInt(list.totalPriceLow) / 100);

                    li.find('.price').html('&yen;<span>' + parseInt(list.totalPriceLow) / 100 + '</span>');
                }

                var amount = parseInt(data.deliveryAmount) ? '<i>(含配送费' + parseInt(data.deliveryAmount) / 100 + '元)</i>' : ''

                carte_check_count.html(data.itemNum + '个菜，' + parseInt(data.totalPriceLow) / 100 + '元' + amount);

                var v = dd.lib.getUriParam(this.State.url, '_ddid');
                History.replaceState({
                    page: 'carte_check',
                    uri: v,
                    data: data,
                    referer: _this.State.data.referer
                }, '淘点点', '?_ddid=' + v + dd.config.url_track);

                _this._updateCarteCache();
            },
            _updateCarteCache: function () {
                var _this = this;
                var abc = _this.abc;

                if (!abc || !inorder_data) {
                    return
                }

                var arr = abc.split('__'),
                    itemid = arr[0],
                    reg = new RegExp(itemid + '$');

                var carte_data = inorder_data[_this.shopid]['carte']; //外卖没有虚拟类目

                for (var i in carte_data) {
                    if (reg.test(i)) {
                        var item_data = carte_data[i];
                        if (parseInt(arr[1]) === 0) {
                            delete carte_data[i]
                        } else {
                            item_data.inOrder = parseInt(arr[1]);
                        }
                    }
                }

                dd.lib.localStorage.set('inorder_data', inorder_data);
            },
            //滚动初始化
            _iScrollInit: function () {
                var _this = this;
                //_this.mainScroll && _this.mainScroll.destroy();

                this._scroll = dd.ui._scroll({
                    'wrap': '#J_carte_checkdelivery_scroll'
                })
            }
        }
    }

    dd.app.CarteCheckDelivery = function () {
        return new CarteCheckDelivery;
    };


})(Zepto, window, document);
/**
 * @Descript: H5页面-智能点菜
 */
(function ($, window, dd) {
    var carte_intelligent_panel = $('#J_carte_intelligent'),
        tpl_carte_intelligent = $('#J_tpl_carte_intelligent'),
        tpl_carte_intelligent_content = $('#J_tpl_carte_intelligent_content'),
        tpl_carte_intelligent_list = $('#J_tpl_carte_intelligent_list'); //菜单模板

    var carte_intelligent_content,
        bridge = window.bridge,
        carte_intelligent_list; //列表容器

    var carte_intelligent_bottom_tip, //统计容器
        order_count; //统计数

    var History = window.History;

    var slide_config = {
        'x': undefined, //
        'wrap': undefined, //容器
        'el': undefined, //点
        'el_half_w': undefined,
        'width': undefined,
        'mg': undefined,
        'min': undefined,
        'max': undefined,
        'unit': undefined,
        'num': 4 //默认人数
    }

    var itg_data = {} //智能点菜类目

    function CarteIntelligent() {
        return {
            wrap: carte_intelligent_panel,
            init: function (arg1) {
                var _this = this;

                _this.storeId = arg1

                _this.count = {
                    'price': 0,
                    'total': 0
                };

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();

            },

            setBeforePageOut: function(){
                carte_intelligent_content = null;
                carte_intelligent_list = null; //列表容器

                carte_intelligent_bottom_tip  = null; //统计容器
                order_count  = null; //统计数

                slide_config = {
                    'x': undefined, //
                    'wrap': undefined, //容器
                    'el': undefined, //点
                    'el_half_w': undefined,
                    'width': undefined,
                    'mg': undefined,
                    'min': undefined,
                    'max': undefined,
                    'unit': undefined,
                    'num': 4 //默认人数
                }
            },

            setAfterPageIn: function () {
                var _this = this;
                $('#J_carte').removeAttr('data-ddid');

                //取width，需要在动画完成后
                var state = History.getState();
                if (state.data && state.data.carteData) {

                    _this._buildTmpl(state.data.carteData);
                    //默认位置
                    _this._setSlidePointer(slide_config.num);
                    $('#J_carte_intelligent_p_num').text(slide_config.num);

                    var ddv = 'carte_intelligent/' + _this.storeId
                    History.replaceState({ 'page': 'carte_intelligent', 'uri': ddv}, '淘点点', '?_ddid=' + ddv + dd.config.url_track);
                }
                this._slideInit();
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'alt': History.getState().data.referer || 'carte/dian/' + _this.storeId
                };
                var tpl = dd.ui.tmpl(tpl_carte_intelligent.html(), options);
                carte_intelligent_panel.html(tpl);

                //loading
                carte_intelligent_content = carte_intelligent_panel.find('#J_carte_intelligent_scroll');
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                _this._getLazyMenu();
            },
            _getLazyMenu: function () {
                var _this = this;
                var state = History.getState();

                //
                carte_intelligent_bottom_tip && carte_intelligent_bottom_tip.hide();

                //来自添加菜单
                if (state.data && state.data.carteData) {
                    return;
                }
                //if(state.)

                //dd.ui.toast.loading();
                //点点
                if (_this.async) {
                    return;
                }
                _this.async = true;

                carte_intelligent_content.html(dd.ui.tpl.load);

                lib.mtop.request({
                    api: 'mtop.life.diandian.lazyMenu',
                    v: '2.0',
                    data: {
                        'hc': slide_config.num,
                        'storeId': _this.storeId,
                        'pz': 1,
                        'pn': 0
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    if (_data.resultCnt) {
                        _this._buildTmpl(_data.menuList[0]);
                    } else {
                        _this._buildNone();
                    }
                    _this.async = false;
                }, function (data) {
                    dd.ui.toast(data, _this);
                    _this.async = false;
                });
            },
            //渲染菜单
            _buildTmpl: function (data) {
                var _this = this;

                //carte_intelligent_panel.html(tpl);
                carte_intelligent_content.html(tpl_carte_intelligent_content.html());
                carte_intelligent_list = $('#J_carte_intelligent_list');

                //统计
                carte_intelligent_bottom_tip = $('#J_carte_intelligent_bottom_tip');
                order_count = carte_intelligent_bottom_tip.find('.J_order_count');

                console.log(data)
                var tpl = dd.ui.tmpl(tpl_carte_intelligent_list.html(), data);
                _this.startUp(tpl)

                $('#J_carte_intelligent_save').removeClass('disabled');
                //dd.ui.toast.hide();

                //统计
                if (data.totalPrice.toString().indexOf('.') > 0) {
                    data.totalPrice = parseFloat(data.totalPrice).toFixed(2);
                }

                carte_intelligent_bottom_tip.show();
                _this._inOrderTotal();

                _this._iScrollInit();
            },
            startUp: function (tpl) {
                carte_intelligent_list.html(tpl);
            },
            events: [
                [dd.event.click, '#J_carte_intelligent_carteadd', '_carteaddHandler'],
                [dd.event.click, '#J_carte_intelligent_list li', '_liHandler'],
                [dd.event.click, '#J_carte_intelligent_refresh', '_refreshHandler'],
                [dd.event.click, '.J_carte_options', '_optionsHandler'],
                [dd.event.click, '.J_lazy_up', '_lazyUpHandler'],
                [dd.event.click, '#J_carte_intelligent_save', '_saveHandler'],
                ['touchstart', '#J_intelligent_slide_wrap', '_touchstartHandler'],
                ['touchmove', '#J_intelligent_slide_wrap', '_touchmoveHandler'],
                ['touchend', '#J_intelligent_slide_wrap', '_touchendHandler']
            ],
            //自己选个菜
            _carteaddHandler: function () {
                var _this = this,
                    data = {},
                    t = 0;

                carte_intelligent_list.children('li').each(function (k, v) {
                    var item = $(this),
                        skuid = item.data('skuid');

                    if (item.attr('data-id')) {
                        data['itg_' + item.attr('data-id') + (skuid ? '_' + skuid : '')] = {
                            'inOrder': item.attr('data-count'),
                            'name': item.find('.name').text(),
                            'price': item.data('price')
                        };
                        t++;
                    }

                });

                data.total = t;

                //dd.lib.memCache.set('intelligent2carte', data);
                //清理uid

                var ddid = 'carte/itg/' + _this.storeId;
                $('#J_carte').removeAttr('data-ddid');
                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'intelligent2carte': data,
                            'referer': 'carte_intelligent/' + _this.storeId
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },
            //toggle +-
            _liHandler: function (e, el) {
                e.preventDefault();

                if (e.target.tagName !== 'A' && $(el).attr('data-id')) {
                    if($(e.target).hasClass('J_carte_options')){
                        return;
                    }
                    $(el).toggleClass('tfin');
                }
            },
            //刷新
            _refreshHandler: function (e, el) {
                this._getLazyMenu();
            },
            //+-
            _optionsHandler: function (e, el) {
                e.preventDefault();
                this._carteOptions($(el));
            },
            //up
            _lazyUpHandler: function (e, el) {
                e.preventDefault();
                this._upLazyOptions($(el).parents('li'));
            },
            //保存
            _saveHandler: function (e, el) {
                var _this = this;
                if ($(el).hasClass('disabled')) {
                    return
                }

                bridge.push("login", function () {
                    _this._orderSave();
                });
            },
            _touchstartHandler: function () {
                slide_config.el[0].style.webkitTransition = '0ms';
            },
            _touchmoveHandler: function (e) {
                var _this = this;
                e.preventDefault();
                setTimeout(function () {
                    slide_config.x = e.touches[0].pageX - slide_config.mg;

                    if (slide_config.x < 0 || slide_config.x > (slide_config.max - slide_config.mg)) {
                        return
                    }

                    slide_config.el[0].style.webkitTransform = 'translateX(' + (slide_config.x) + 'px)';
                    _this._setSlideDynamicDoc(_this._getSlideIndex(slide_config.x));

                }, 0);
            },
            _touchendHandler: function () {
                var index = this._getSlideIndex(slide_config.x);
                if(index){
                    slide_config.num = index;
                    $('#J_carte_intelligent_p_num').text(index);

                    this._getLazyMenu();
                }
            },
            //没有菜单
            _buildNone: function () {
                var _this = this;

                //_this.mainScroll && _this.mainScroll.destroy();
                carte_intelligent_content.html(dd.ui.tmpl(dd.ui.tpl.none, {'msg': '没有菜单哦'}));

                $('#J_carte_intelligent_save').addClass('disabled');
                $('#J_carte_intelligent_bottom_tip').hide();
            },
            _slideInit: function () {
                var _this = this;

                slide_config.wrap = $('#J_intelligent_slide_wrap'),
                    slide_config.el = $('#J_intelligent_slide_pointer');

                var doc_width = window.document.body.clientWidth;
                /*width = doc_width - (doc_width*0.05*2),*/
                width = slide_config.width = slide_config.wrap.find('.slide_line').width();

                /*min = (width/20)/2,
                 max = width-min;*/
                slide_config.mg = (doc_width - slide_config.width) / 2,
                    slide_config.min = slide_config.mg,
                    slide_config.max = doc_width - slide_config.mg;

                slide_config.el.show();

                //人数slide
                slide_config.el_half_w = slide_config.el.width() / 2;
                slide_config.unit = slide_config.width / 20;

                //默认位置
                _this._setSlidePointer(slide_config.num);
            },
            _getSlideIndex: function (x) {
                var _this = this;
                if (x <= 0) {
                    x = 1;
                }
                if (x > slide_config.width) {
                    x = slide_config.width;
                }
                /*
                 */
                return Math.ceil(x / slide_config.unit);
            },
            //设置数量位置
            _setSlidePointer: function (index) {
                var _this = this;
                var to = (index - 1) * slide_config.unit + (slide_config.unit / 2) + slide_config.mg - (slide_config.el_half_w);

                slide_config.el[0].style.webkitTransition = '100ms';
                slide_config.el[0].style.webkitTransform = 'translateX(' + to + 'px)';

                _this._setSlideDynamicDoc(index);
            },
            //修改显示数量
            _setSlideDynamicDoc: function (index) {
                var _this = this;
                slide_config.el.find('i').attr('class', 'n' + index);

            },
            //菜单分量选择
            _carteOptions: function (el) {
                var _this = this;
                var role = el.data('role'),
                    carte_current = el.parents('li'),
                    carte_count = el.siblings('.J_carte_count'),
                    num_el = carte_current.find('.J_num'),
                    del = false;

                var cc = parseInt(carte_count.text());

                if (role == 'plus') {
                    cc++;
                    el.siblings().removeClass('dn');
                } else {
                    cc--;

                    //清零
                    if (cc <= 0) {
                        if (confirm('确定要删除' + carte_current.find('.name').text() + '吗？')) {
                            del = true;
                            _this._inOrderTotal(carte_current);
                            _this._scroll.refresh()
                            return;
                        } else {
                            return;
                        }
                    }

                }


                carte_count.text(cc);
                carte_current.attr('data-count', cc);
                num_el.text(cc);

                _this._inOrderTotal();
            },
            _inOrderTotal: function (item) {
                var _this = this;
                //item_price = parseFloat(item.attr('data-price'));

                item && (item.remove());

                var p = 0, t = 0;
                carte_intelligent_list.children('li').each(function (k, v) {
                    var li = $(this),
                        li_t = parseInt(li.attr('data-count'));
                    p += parseFloat(li.attr('data-price')) * li_t;
                    t += li_t;
                    /*if(item.attr('data-id')) {
                     info_arr.push(item.attr('data-id')+':'+item.attr('data-skuid')+':'+item.attr('data-count'));
                     }*/
                });

                if (String(p).indexOf('.') > 0) {
                    p = p.toFixed(2);
                }

                _this.count.price = p;
                _this.count.total = t;

                order_count.html('总计&yen;' + _this.count.price + '/' + _this.count.total + '个菜');


            },
            //订单统计
            _getInfos: function () {
                var _this = this,
                    info_arr = [];

                carte_intelligent_list.children('li').each(function (k, v) {
                    var item = $(this);
                    if (item.attr('data-id')) {
                        info_arr.push(item.attr('data-id') + ':' + item.attr('data-skuid') + ':' + item.attr('data-count'));
                    }
                });

                return info_arr;
            },
            //uplazy
            _upLazyOptions: function (el) {
                var _this = this;

                if (_this.async) {
                    return;
                }
                _this.async = true;

                lib.mtop.request({
                    api: 'mtop.life.diandian.upLazyMenu',
                    v: '2.0',
                    data: {
                        'storeId': _this.storeId,
                        'l': el.attr('data-id'),
                        'h': _this._getItemIds().join(',')
                    },
                    extParam: {}
                }, function (data) {
                    //dd.ui.toast.hide();
                    if (data.data) {
                        _this._menuReplace(el, data.data);
                    }
                    _this.async = false;
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false;
                });
            },
            //替换
            _menuReplace: function (el, data) {
                var _this = this;

                var index = el.index();

                var tpl = dd.ui.tmpl(tpl_carte_intelligent_list.html(), data);

                //dd.ui.toast.hide();
                el.replaceWith(tpl);

                _this._inOrderTotal();
                _this._scroll.refresh();
            },
            _orderSave: function () {
                var _this = this;

                if (_this.async) {
                    return;
                }
                _this.async = true;

                lib.mtop.request({
                    api: 'mtop.life.diandian.optionCart',
                    v: '1.0',
                    data: {
                        'storeId': _this.storeId,
                        'o': 0,
                        'info': _this._getInfos().join(';'),
                        'bizLine': 0,
                        'num': slide_config.num,
                        'platform': dd.mtop_platform
                    },
                    extParam: {}
                }, function (data) {
                    //dd.ui.toast.hide();
                    if (data.data) {
                        var ddid = 'carte_check/' + _this.storeId;
                        /*var state_obj = {
                         'page': 'carte_intelligent',
                         'uri': ddid,
                         'data': data.data,
                         'referer': 'carte_intelligent/'+_this.storeId,
                         'num': slide_config.num
                         };*/
                        $('#J_carte_check').attr('data-ddid', '')
                        var state_obj = {
                            'push': {
                                'ddid': ddid,
                                'obj': {
                                    'data': data.data,
                                    'referer': 'carte_intelligent/' + _this.storeId,
                                    'num': slide_config.num
                                }
                            }
                        };
                        dd.lib.ddState(state_obj);
                    }
                    _this.async = false;
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false;
                });
            },
            //滚动初始化
            _iScrollInit: function () {
                this._scroll = dd.ui._scroll({
                    'wrap': '#J_carte_intelligent_scroll'
                })
                /*var _this = this;
                 _this.mainScroll && _this.mainScroll.destroy();

                 var pulldown_el = _this.pulldown_el = carte_intelligent_panel.find('.J_pulldown');

                 var pullDownOffset = pulldown_el[0].offsetHeight;

                 _this.mainScroll = dd.ui.scroll({
                 'view': _this,
                 'wrap': '#J_carte_intelligent_scroll',
                 'pullDownAction': _this._pullDownAction
                 });*/
            },
            _pullDownAction: function () {
                //刷新
                var _this = this;

                //dd.ui.toast.loading();
                //点点
                lib.mtop.request({
                    api: 'mtop.life.diandian.autoGetOneItem',
                    v: '2.0',
                    data: {
                        'storeId': _this.storeId,
                        'itemId': _this._getItemIds()[0],
                        'itemIds': _this._getItemIds().join(',')
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    if (_data) {
                        _this._menuAdd(_data)
                        /*_this.buildMenu(_data);*/
                    }
                }, function (data) {
                    dd.ui.toast(data);
                });

                //重置当前页
                /*page['page_current_t'+type] = 1;

                 _this.getMyOrder('refresh');*/
            },
            //获取ids
            _getItemIds: function () {
                var _this = this,
                    ids_arr = [];

                carte_intelligent_list.children('li').each(function (k, v) {
                    var item = $(this);
                    if (item.attr('data-id')) {
                        ids_arr.push(item.attr('data-id'));
                    }
                });

                return ids_arr;
            },
            _menuAdd: function (data) {

                var _this = this;
                var options = {
                    'items': data.result.menu
                }
                var tpl = dd.ui.tmpl(tpl_carte_intelligent_list.html(), options);
                carte_intelligent_list.prepend(tpl);

                //dd.ui.toast.hide();
                _this._scroll.refresh();

                _this._inOrderTotal();
            }
        }
    }

    dd.app.CarteIntelligent = function () {
        return new CarteIntelligent;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-买单页
 */
(function ($, window, dd) {
    var check_panel = $('#J_check'),
        tpl_check = $('#J_tpl_check'),
        tpl_check_list = $('#J_tpl_check_list'),
        tpl_check_pop = $('#J_tpl_check_pop'),

        dialog, //弹层
        bridge = window.bridge;

    //订单数据
    check_data = {};

    function Check() {
        return {
            orders: {},

            wrap: check_panel,

            init: function () {
                var _this = this;

                _this.ttid = dd.lib.getUriParam(History.getState().url, '_ddid');

                _this.initHandler();
            },

            //处理退出页面时保存之前全局变量状态的情况(临时加)
            setAfterPageOut: function () {
                check_data = {};
            },

            initHandler: function () {
                var _this = this;

                _this._renderStatic();
                _this._renderDynamic();
            },

            _renderDynamic: function () {
                var _this = this;
                bridge.push("login", function () {
                    _this.getListData();
                });
            },

            _renderStatic: function () {
                this.wrap.html(tpl_check.html());

                this.pullup_el = check_panel.find('.J_pullUp');

                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: "http://g.dd.alicdn.com/tps/i1/T1nyYUFlJfXXcm2uvj-56-56.png"
                });
            },
            menuEvent: '_scan',
            events: [
                [dd.event.click, '.J_Check', '_check'],
                [dd.event.click, '#J_ScanBtn', '_scan'],
                [dd.event.click, '#J_Ticket', '_goTicket'],
                [dd.event.click, '.J_pop_store_item', '_storeHandler']
            ],

            _goTicket: function () {
                var _this = this,
                    url = 'http://h5.m.taobao.com/dd/card/index.html';

                _this.ttid && (url += "?ttid=" + _this.ttid);

                bridge.push("pushWindow", {url: url});
            },

            getListData: function () {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.buyerCheckOutList',
                    v: '1.0'
                }, function (data) {
                    var _data = data.data;
                    if (_data.list && _data.list.length > 0) {
                        _this._buildList(_data);
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },


            _buildList: function (data) {
                var _this = this,
                    check_list = $('#J_CheckList');

                //存储数据
                $.each(data.list, function (i, item) {
                    _this.orders[i] = item;
                });

                var tpl = dd.ui.tmpl(tpl_check_list.html(), data);

                check_list.removeClass('nothing').html(tpl);
            },

            _check: function (ev) {
                var _this = this,
                    $el = $(ev.target),
                    index = $el.attr('data-index'),
                    current_order = _this.orders[index];


                switch (current_order.type) {
                    //预定
                    case '0':
                        _this._pushPay(current_order.storeId, {
                            reserve: 1,
                            orderId: current_order.reserveId,
                            shopname: current_order.shopName
                        });
                        break;
                    //卡券
                    case '1':
                        _this.userCoupon(current_order.evoucherId);
                        break;
                    //点菜
                    case '2':
                        _this._pushPay(current_order.storeId, {
                            reserve: 0,
                            orderId: current_order.menuId,
                            shopname: current_order.shopName
                        });
                        break;
                }
            },

            _storeHandler: function (e, el) {
                dialog.hide();
                dialog = {};
                this._pushPay($(el).data('storeid'));
            },

            _pushPay: function (storeid, order_type) {
                if (order_type) {
                    dd.lib.memCache.set('pay_detail', order_type);
                }

                dd.lib.ddState({
                    'push': {
                        'ddid': 'pay_detail/' + storeid,
                        'obj': {
                            'referer': 'check'
                        }
                    }
                });
            },

            userCoupon: function (id) {
                var _this = this;
                _this.geo_location = dd.lib.memCache.get('geo_location') || {};

                lib.mtop.request({
                    api: 'mtop.dd.voucher.user.detail',
                    v: '1.0',
                    data: {
                        'voucherId': id,
                        'latitude': _this.geo_location.latitude,
                        'longitude': _this.geo_location.longitude
                    }
                }, function (data) {
                    var _data = data.data;
                    if (_data.localstores.length > 1) {
                        var list = dd.common.useEvoucher.evoucherUse(_data.localstores, _this.geo_location);

                        dialog = dd.ui.dialog({
                            'cls': 'evoucherpop',
                            'title': '确定您所在的门店',
                            'wrap': '#J_check',
                            'content': '<ul class="pop_shop_list">' + list + '</ul>',
                            'maxheight': '300'
                        });
                    } else {
                        _this._pushPay(_data.localstores[0].localstoreId);
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },

            _scan: function () {
                var _this = this;

                bridge.push("scan", {
                    type: 'qr'
                }, function () {
                    var qrCode = arguments[0].qrCode;
                    lib.mtop.request({
                        api: 'mtop.life.diandian.simpleScanCode',
                        v: '1.0',
                        data: {
                            'codeUrl': qrCode,
                            'from': 3
                        }
                    }, function (data) {
                        if (data.data.needLogin > 0) {
                            lib.mtop.request({
                                api: 'mtop.life.diandian.ecodeScanCode',
                                v: '1.0',
                                data: {
                                    'codeUrl': qrCode,
                                    'from': 3,
                                    'ddOrderId': 0
                                }
                            }, function (data) {
                                _this.scanRoute(data.data);

                            }, function (data) {
                                dd.ui.toast(data);
                            });
                        } else {
                            _this.scanRoute(data.data);
                        }
                    }, function (data) {
                        dd.ui.toast(data);
                    });
                });
            },

            scanRoute: function (data) {
                var type = data.type;
                if (type == 'pay') {
                    if (data.data.code == '-3000') {
                        bridge.push('alert', {
                            title: '提示',
                            message: data.data.message,
                            buttons: ['确定']
                        });
                        return;
                    }

                    var _orderData = data.data.orderRespDTO;
                    dd.lib.memCache.set('pay_detail', _orderData);
                    dd.lib.ddState({
                        'push': {
                            'ddid': 'pay_detail/' + _orderData.localstoreId,
                            'obj': {
                                'referer': 'check'
                            }
                        }
                    });
                }
            }
        }
    }

    dd.app.Check = function () {
        return new Check;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-买单支付详情
 */
(function ($, window, dd) {
    var COUPON_TYPE_NAME = {
            'coupon': '代金券',
            'reserve': '预定定金'
        },

        total_pay = 0,
        isUseCoupon = false,
        old_type = null,
        //使用次数受限的券类
        coupon_type = {
            '0': {}, //排他
            '1': {} //非排他
        },

        bridge = window.bridge,

        pay_detail_panel = $('#J_pay_detail'),
        tpl_pay_detail = $('#J_tpl_pay_detail'),
        tpl_pay_detail_coupon = $('#J_tpl_pay_detail_coupon');

    function PayDetail() {
        return {
            wrap: pay_detail_panel,

            init: function (arg1) {
                var _this = this;

                _this.storeId = arg1;

                _this.pay_detail = dd.lib.memCache.get('pay_detail');

                //预订订单标志位
                _this.reserve = _this.pay_detail ? _this.pay_detail.reserve : 1;

                //订座订单号或预订订单号
                _this.orderId = _this.pay_detail ? _this.pay_detail.orderId : '';

                _this.taobaoOrderNo = _this.pay_detail ? _this.pay_detail.taobaoOrderNo : null;

                _this.initHandler();
            },

            initHandler: function () {
                this._renderDynamic();
            },

            setAfterPageOut: function () {
                //返回后清理之前缓存数据
                dd.lib.memCache.removeValue('pay_detail');
                //重置数据
                total_pay = 0;
                isUseCoupon = false;
                old_type = null;
                coupon_type = {
                    '0': {},
                    '1': {}
                }
            },
            setBeforePageOut: function () {
                this._rollback();
                document.activeElement.blur();
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;

                this.wrap.html(dd.ui.tpl.load);

                if (_this.pay_detail) {
                    _this._renderTpl(_this.pay_detail);
                }
                else {
                    _this.getStoreInfo();
                }
            },

            _renderTpl: function (data) {
                var _this = this,  first = true;
                    tpl = dd.ui.tmpl(tpl_pay_detail.html(), {
                        storeName: data.storeName || data.localstoreName || data.shopname,
                        address: data.address
                    });

                this.wrap.html(tpl);

                if (dd._hideTitleBar) {
                    try {
                        _this.wrap.find(".hd_title").find("h2") && bridge.push("setTitle", {
                            title: _this.wrap.find(".hd_title").find("h2").html()
                        });
                    } catch (e) {
                        console.log(e);
                    }
                }

                if (_this.taobaoOrderNo) {
                    var input = $('#J_Money');
                    input.val(parseInt(_this.pay_detail.price) / 100).attr('readonly', 'true');
                    first = false;
                }

                _this._getCoupons(input, first);

                if (/Android/.test(navigator.userAgent)) {
                    _this._placeHolder();
                }
            },

            getStoreInfo: function () {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.getDetailInfo',
                    v: '1.0',
                    data: {
                        'localstore_id': _this.storeId
                    }
                }, function (data) {
                    _this._renderTpl(data.data);
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },

            events: [
                [dd.event.click, '#J_pay_detail_back', '_rollback'],
                ['blur', '#J_Money', '_showMore'],
                //['focus', '#J_Money', 'hideBottom'],
                [dd.event.click, '.J_Item', '_checkCoupon'],
                [dd.event.click, '#J_PayBtn', '_payOrder']
            ],

            //hack placeholder attr for old mobile(Android)
            _placeHolder: function () {
                var money_input = $('#J_Money'),
                    money_wrap = money_input.parent('.money'),
                    text = money_input.attr('placeholder');

                money_input.removeAttr('placeholder');
                money_wrap.append('<label for="J_Money" class="fake_holder">' + text + '</label>');

                if ($.trim(money_input.val()) !== '') {
                    money_wrap.addClass('focus');
                }

                money_input.on('focus blur', function (e) {
                    var tar_node = $(e.currentTarget);

                    if (e.type == 'blur') {
                        $.trim(tar_node.val()) !== '' ? money_wrap.addClass('focus') : money_wrap.removeClass('focus');
                    }
                    else {
                        money_wrap.addClass('focus');
                    }
                });
            },

            _rollback: function (ev, el) {
                var _this = this;

                _this.roll_back = true;

                setTimeout(function () {
                    _this.roll_back = false;
                }, 250)
            },

            /*hideBottom: function (e, el) {
                if ($(el).attr('readonly') == 'true') {
                    return;
                }

                $('#J_Pay_Bottom').hide();
            },*/

            _showMore: function (ev, el) {
                var _this = this;

                setTimeout(function () {
                    if (!_this.roll_back) {
                        if (el.value <= 0 || $.trim(el.value) == '') {
                            el.value = '';
                            dd.ui.toast('请输入大于零的金额');
                            return;
                        }
                        //重置券的价值及其他数据
                        total_coupon = 0;
                        isUseCoupon = false;
                        old_type = null;
                        coupon_type = {
                            '0': {},
                            '1': {}
                        };

                        _this._getCoupons(el);
                    }
                }, 100);
            },

            _getCoupons: function (input, first) {
                var _this = this, param;

                if(first && !_this.taobaoOrderNo){
                    param = {
                        api: 'mtop.dd.voucher.user.list.localstore',
                        v: '1.0',
                        data: {
                            'localstoreId': _this.storeId,
                            'status': 1
                        }
                    }
                }else{
                    //如果是扫码付款，已经带有支付订单号
                    if (_this.taobaoOrderNo) {
                        param = {
                            api: 'mtop.dd.order.scanInfo',
                            v: '1.0',
                            data: {
                                'orderNo': _this.taobaoOrderNo,
                                'isDetail': 2
                            }
                        };
                    } else {
                        //不带订单号的买单走扫描店铺入口（ 如店铺买单 ）
                        param = _this.orderId ? {
                            api: 'mtop.life.diandian.createPayOrder',
                            v: '1.0',
                            data: {
                                'flag': _this.reserve || 0,
                                'extraId': _this.orderId,
                                'price': input.value,
                                'quanVer': 2
                            }
                        } : {
                            api: 'mtop.dd.order.scanAndCreateWithPrice',
                            v: '1.0',
                            data: {
                                'orderInfo': 'http://tc.taobao.com/q/y4/e1/l' + _this.storeId,
                                'isDetail': 2,
                                'price': input.value
                            }
                        };
                    }
                }

                lib.mtop.request(param, function (data) {
                    var _data = data.data,
                        vouchers = _data.userVoucherRespDTOs || _data.list;

                    _this.payOrderData = _data;

                    if (vouchers) {
                        var tpl = dd.ui.tmpl(tpl_pay_detail_coupon.html(), _this.processData(vouchers, first));
                        $('#J_Coupons').html(tpl);
                    }
                    else {
                        $('#J_Nothing').show();
                    }

                    if(!first){
                        $('#J_Reduction').show();
                        $('#J_PayBtn').removeClass('disable');

                        _this.calculate();
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },

            processData: function (data, first) {
                var _this = this,
                    list = [],
                    ex_list = []; //排他券列表

                $.each(data, function (index, item) {
                    item.expired = _this.formatTime(item.expiredTime);
                    item.couponType = COUPON_TYPE_NAME[item.itemType];
                    item.couponValue = parseInt(item.par) / 100;
                    item.reserve = item.itemType == 'reserve';

                    if (item.useRule.exclusive == 'true') {
                        ex_list.push(item);
                    } else {
                        list.push(item);
                    }
                });

                return {
                    list: list,
                    ex_list: ex_list,
                    first: first
                };
            },

            //计算时间差 dataType: 2014-01-01 00:00:00
            /*dateDiff: function (startTime, endTime) {
                //将xxxx-xx-xx的时间格式，转换为 xxxx/xx/xx的格式
                startTime = startTime.replace(/\-/g, "/");
                endTime = endTime.replace(/\-/g, "/");

                var begin = new Date(startTime),
                    end = new Date(endTime);

                return parseInt((end.getTime() - begin.getTime()) / parseInt(1000 * 3600 * 24));
            },*/

            //去年份，获取日期
            formatTime: function(time){
                var date = time.split(' ')[0],
                    date_unit = date.split('-');

                return date_unit[1] + '-' + date_unit[2];
            },

            _checkCoupon: function (ev) {
                var _this = this,
                    $target = $(ev.currentTarget);

                if($target.hasClass('disable')){
                    return;
                }

                var coupon,
                    trigger = $target.find('b'),
                    limit = $target.attr('data-limit'),
                    isSingle = $target.attr('data-single') ? '1' : '0',
                    type = limit ? limit : '0';  //标志券类型

                //初始化限制券类型
                if (coupon_type[isSingle][type] == undefined) {
                    coupon_type[isSingle][type] = 0;
                }

                coupon = coupon_type[isSingle][type];


                if (isSingle == '1') {
                    coupon_type['0'] = {};
                    if (coupon == 0) {
                        if (!trigger.hasClass('checked')) {
                            $('#J_Coupons').find('b').removeClass('checked');
                        }
                        if (!!old_type && old_type !== type) {
                            coupon_type[isSingle][old_type] = 0;
                        }
                        old_type = type;
                        //dd.ui.toast('所选优惠不可同时使用哦');
                        _this.calculate(trigger, limit, isSingle, type);
                    }

                    else if (coupon > 0) {
                        _this.calculate(trigger, limit, isSingle, type);
                    }
                }
                else {
                    $('#J_Single_Coupons').find('b').removeClass('checked');
                    coupon_type['1'] = {};

                    _this.calculate(trigger, limit, isSingle, type);
                }
            },


            //计算券的总价值,并计算已勾选的使用受限券类张数
            calculate: function (trigger, limit, isSingle, type) {
                if (trigger) {
                    $(trigger).toggleClass('checked');

                    if ($(trigger).hasClass('checked')) {
                        if (limit) {
                            coupon_type[isSingle][type]++;

                            if (coupon_type[isSingle][type] > parseInt(limit)) {
                                $(trigger).removeClass('checked');
                                dd.ui.toast('该现金券限制一次使用' + limit + '张');
                                coupon_type[isSingle][type]--;
                                return;
                            }
                        }
                    }
                    else {
                        if (limit) {
                            coupon_type[isSingle][type]--;
                        }
                    }
                }
                //console.log(coupon_type[isSingle]);
                var total_coupon = 0;
                $.each($('#J_Coupons').find('b.checked'), function (i, item) {
                    total_coupon += parseFloat($(item).attr('data-value'));
                });

                var money = $('#J_Money').val() - total_coupon;
                money = money < 0 ? 0 : money;
                total_pay = money;

                $('#J_ReduceMoney').html(total_coupon);

                $('#J_NeedPay').html('￥' + money.toFixed(2));
            },

            _payOrder: function (e, el) {
                var _this = this,
                    inputMoney = $('#J_Money').val();

                if($(el).hasClass('disable')){
                    return;
                }

                //有使用券未有勾选
                noUseCoupon = total_pay == inputMoney;

                bridge.push('confirm', {
                    title: '提示',
                    message: '请确认您已经到店内再买单哦',
                    okButton: '确认买单',
                    cancelButton: '取消'
                }, function (result) {
                    if (result.ok) {
                        //有优惠券的情况
                        if (_this.payOrderData.evoucherDtos) {
                            //有券没使用
                            if (noUseCoupon && _this.payOrderData.evoucherDtos.length > 0) {
                                bridge.push('confirm', {
                                    title: '提示',
                                    message: '您有可使用的现金券，是否使用？',
                                    okButton: '是',
                                    cancelButton: '否'
                                }, function (result) {
                                    if (!result.ok) {
                                        _this.startPay();
                                    }
                                });
                            }
                            else if (!noUseCoupon && (inputMoney < total_coupon)) {
                                bridge.push('confirm', {
                                    title: '提示',
                                    message: '使用的现金券金额大于订单金额, 多出的余额不退，确定继续付款？',
                                    okButton: '确认',
                                    cancelButton: '取消'
                                }, function (result) {
                                    if (result.ok) {
                                        _this.startPay();
                                    }
                                });
                            }
                            else {
                                _this.startPay();
                            }
                        } else {
                            _this.startPay();
                        }
                    }
                });
            },

            startPay: function () {
                var _this = this;
                dd.ui.toast.loading();

                //获取已选现金券
                if (!isUseCoupon) {
                    var vouchers = [];
                    checked_coupons = $('#J_Coupons').find('b.checked');

                    $.each(checked_coupons, function (i, item) {
                        vouchers.push(item.id);
                    });
                }

                lib.mtop.request({
                    api: 'mtop.dd.order.pay',
                    v: '1.0',
                    data: {
                        "orderNo": _this.payOrderData.taobaoOrderNo,
                        "voucher": vouchers.join(',')
                    }
                }, function (data) {
                    var _data = data.data;
                    //优惠券金额完全抵消支付金额的情况，即实际支付为零,无需走支付宝
                    if (_data.payStatus == '1') {
                        dd.ui.toast.hide();
                        dd.lib.ddState({
                            'replace': {
                                'ddid': 'pay_result' + '/' + _data.taobaoOrderNo,
                                'obj': {
                                    'referer': 'my'
                                }
                            }
                        });
                        return;
                    }

                    _this.toAliPay(_data);
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },

            toAliPay: function (data) {
                //快捷支付
                var _this = this;
                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        tradeNO: data.alipayTradeIds
                    }, function (result) {
                        dd.ui.toast.hide();
                        //支付成功
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            pushResult();
                        }
                    });
                } else {
                    var type = 1,
                        contents = ["预订支付", "确定买单"],
                        title = contents[type] || "";
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': data.taobaoOrderId,
                            'payType': 0
                        }
                    }, function (data) {
                        if (data.data) {
                            if (data.data.canPay == 'true') {
                                dd.ui.alipay({
                                    'title': title,
                                    'alipayUrl': data.data.alipayUrl,
                                    'successFunc': function () {
                                        pushResult();
                                    }
                                });
                            }
                        }
                        dd.ui.toast.hide();
                        _this.async = false;
                    }, function (e) {
                        dd.ui.toast(e);
                        _this.async = false;
                    });
                }

                function pushResult(){
                    dd.lib.ddState({
                        'replace': {
                            'ddid': 'pay_result' + '/' + _this.payOrderData.taobaoOrderNo,
                            'obj': {
                                'referer': 'my'
                            }
                        }
                    });
                }
            }
        }
    }

    dd.app.PayDetail = function () {
        return new PayDetail;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-支付结果
 */
(function ($, window, dd) {
    var pay_result_panel = $('#J_pay_result'),
        tpl_pay_result = $('#J_tpl_pay_result'),

        bridge = window.bridge;


    function PayResult() {
        return {
            wrap: pay_result_panel,

            init: function (arg1) {
                var _this = this,
                    data = History.getState().data;

                _this.orderNo = arg1;

                if (data && data.data) {
                    _this.shop = data.data.branchOffice[0];
                }

                _this.initHandler();
            },

            initHandler: function () {
                this._renderDynamic();
            },

            _renderDynamic: function () {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.dd.order.finish',
                    v: '1.0',
                    data: {
                        'orderNo': _this.orderNo,
                        'withDraw': true
                    }
                }, function (data) {
                    var _data = data.data;

                    _this.data = _data;

                    _this.orderInfo = _data.order;

                    _data.shop = _this.shop;

                    _data.nickname = _this.getNickName();

                    tpl = dd.ui.tmpl(tpl_pay_result.html(), _data);
                    _this.wrap.html(tpl);
                    if (!bridge.supportFunc("share")) {
                        $("#J_PayShareBtn").hide();
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },

            events: [
                [dd.event.click, '.J_RateBtn', '_goRate'],
                [dd.event.click, '.J_UseEvoucher', '_useEvoucher'],
                [dd.event.click, '#J_PayShareBtn', '_goShare'],
                [dd.event.click, '#J_go_my_quan', '_myQuanHandler']
            ],

            _myQuanHandler: function(){
                //去券包看看
                $('#J_my_evoucher').removeAttr('data-ddid');
                dd.lib.ddState({
                    'replace': {
                        'ddid': 'my_evoucher'
                    }
                });
            },

            getNickName: function(){
                var nick_name;

                nick_name = dd.lib.localStorage.get('nick_name');

                var parseName = function(str){
                    str = str.replace(/\\/g, "%");
                    return unescape(str);
                };

                //没有本地存储的数据就拿cookie的
                if(!nick_name){
                    nick_name = parseName(lib.storage.cookie.getCookie('tracknick'));
                }

                return nick_name;
            },

            //去评价
            _goRate: function () {
                var _this = this;

                _this.data.order.shop = _this.data.order.title;

                dd.lib.ddState({
                    'push': {
                        'ddid': 'review/' + _this.orderNo,
                        'obj': {
                            'referer': 'pay_result',
                            'orderData': _this.data.order
                        }
                    }
                });
            },

            //去分享
            _goShare: function () {
                var _this = this;
                bridge.push('share', {
                    title: _this.orderInfo.title,
                    content: '可以用淘点点买单，超级方便，推荐你也试试',
                    url: 'http://h5.m.taobao.com/dd/jump.htm?_jump=' + _this.orderInfo.localstoreId,
                    image: 'http://g.dd.alicdn.com/tps/i4/T1kHywFuhdXXbYfSkc-640-1738.png'
                });
            }
        }
    }

    dd.app.PayResult = function () {
        return new PayResult;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-城市
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var city_panel = $('#J_city'),
        tpl_city = $('#J_tpl_city'),
        tpl_city_content = $('#J_tpl_city_content');

    var city_content;

    function City() {
        return {
            wrap: city_panel,
            init: function (arg1) {
                var _this = this;

                _this.role = arg1; //index首页 dian点菜 delivery外卖 nearby附近

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            //切换完成后撤消
            setAfterPageOut: function () {
                setTimeout(function () {
                    dd.lib.memCache.removeValue('update_city');
                }, 0)
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;
                _this.alt = History.getState().data.referer || 'index';

                var options = {
                    'alt': _this.alt
                };
                var tpl = dd.ui.tmpl(tpl_city.html(), options);
                city_panel.html(tpl);

                //loading
                city_content = city_panel.find('#J_city_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                //判断是否存储过城市
                if (dd.lib.memCache.get('city_list')) {
                    _this.startUp({
                        'cityList': dd.lib.memCache.get('city_list'),
                        'location': dd.lib.memCache.get('geo_location')
                    });
                } else {
                    _this._geo();
                }
            },
            _geo: function () {
                var _this = this;
                dd.lib.getH5Geo({
                    'callback': function (g_pos, data) {
                        //城市列表请求失败
                        if (!dd.lib.memCache.get('city_list')) {
                            dd.ui.toast(data, _this);
                            return
                        }

                        //成功渲染
                        _this.startUp({
                            'cityList': dd.lib.memCache.get('city_list'),
                            'location': dd.lib.memCache.get('geo_location')
                        });
                    }
                });
            },
            //启动
            startUp: function (data) {
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_city_content.html(), data);
                city_content.html(tpl);

                _this._iScrollInit();
            },
            events: [
                [dd.event.click, '.J_city_item', '_itemHandler'],
                [dd.event.click, '#J_city_retry', '_retryHandler'],
                [dd.event.click, '#J_index_search', '_searchHandler']
            ],
            //点击城市
            _itemHandler: function (e, el) {
                var _this = this,
                    index = $(el).index();

                var data = $(el).data('data') || _this.geoPos;

                if (data) {
                    dd.lib.localStorage.set('current_city', data);
                    dd.lib.memCache.set('update_city', true);
                }

                //$("#J_index").removeAttr("data-ddid");

                dd.lib.ddState({
                    'back': {
                        'ddid': _this.alt
                    }
                })
            },
            //定位重试
            _retryHandler: function (e) {
                var _this = this,
                    $this = $(e.target);
                _this.geoPos = undefined;
                dd.ui.toast.loading();
                dd.lib.getH5Geo({
                    'callback': function (pos, data) {
                        var _data = data.data;
                        dd.ui.toast.hide();
                        if (pos && _data.location) {
                            $this.replaceWith('<li class="J_city_item" data-lat="' + pos.latitude + '" data-long="' + pos.longitude + '" data-id="' + _data.location.cityId + '">' + _data.location.cityName + '</li>');
                            _this.geoPos = {cityId: _data.location.cityId, cityName: _data.location.cityName, longitude: pos.longitude, latitude: pos.latitude};
                        }
                    }
                });
            },
            _iScrollInit: function () {
                var _this = this;
                /*_this.mainScroll && _this.mainScroll.destroy();

                 //city_panel.find('.J_pulldown').show();

                 _this.mainScroll = dd.ui.scroll({
                 'view': _this,
                 'wrap': '#J_city_scroll',
                 'pullDownAction': _this._pullDownAction
                 });*/
            },
            _pullDownAction: function () {
                this._geo();
            }
        }
    }

    dd.app.City = function () {
        return new City;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-城市所有
 */
(function($, window, dd){
    var bridge = window.bridge;
	var city_all_panel = $('#J_city_all');

	var tpl_city_all = $('#J_tpl_city_all');

	var CITY_ALL_DATA = {"1hot":[[110100,"\u5317\u4eac",116.41210174560547,39.90364074707031],[310100,"\u4e0a\u6d77",121.4745101928711,31.230649948120117],[440100,"\u5e7f\u5dde",113.26525115966797,23.128700256347656],[440300,"\u6df1\u5733",114.05780029296875,22.54290008544922],[330100,"\u676d\u5dde",120.15509033203125,30.27298927307129],[430100,"\u957f\u6c99",112.93878173828125,28.227720260620117],[510100,"\u6210\u90fd",104.0647201538086,30.65867042541504],[500100,"\u91cd\u5e86",106.5521469116211,29.562820434570312],[210200,"\u5927\u8fde",121.61470794677734,38.913631439208984],[440600,"\u4f5b\u5c71",113.1217269897461,23.024370193481445],[350100,"\u798f\u5dde",119.29650115966797,26.073970794677734],[230100,"\u54c8\u5c14\u6ee8",126.53511810302734,45.80329895019531],[340100,"\u5408\u80a5",117.22775268554688,31.820430755615234],[370100,"\u6d4e\u5357",116.99520111083984,36.66537857055664],[330400,"\u5609\u5174",120.74832153320312,30.745149612426758],[330700,"\u91d1\u534e",119.64749145507812,29.0781192779541],[360100,"\u5357\u660c",115.85845184326172,28.6830997467041],[320100,"\u5357\u4eac",118.79637908935547,32.05830001831055],[330200,"\u5b81\u6ce2",121.54974365234375,29.874040603637695],[370200,"\u9752\u5c9b",120.38289642333984,36.066158294677734],[460200,"\u4e09\u4e9a",109.51116180419922,18.252399444580078],[330600,"\u7ecd\u5174",120.57785034179688,30.004470825195312],[210100,"\u6c88\u9633",123.43182373046875,41.80622863769531],[320500,"\u82cf\u5dde",120.58541107177734,31.29878044128418],[120100,"\u5929\u6d25",117.21446990966797,39.12080001831055],[320200,"\u65e0\u9521",120.30281829833984,31.56591033935547],[420100,"\u6b66\u6c49",114.30522918701172,30.592769622802734],[610100,"\u897f\u5b89",108.94412231445312,34.264801025390625],[350200,"\u53a6\u95e8",118.0893783569336,24.479530334472656],[321000,"\u626c\u5dde",119.41354370117188,32.39379119873047]],"A":[[210300,"\u978d\u5c71",122.99420166015625,41.10858154296875],[410500,"\u5b89\u9633",114.39305877685547,36.09767150878906],[340800,"\u5b89\u5e86",117.0571517944336,30.52482032775879],[520400,"\u5b89\u987a",105.947509765625,26.2529296875],[513200,"\u963f\u575d",102.22528076171875,31.90007972717285],[652900,"\u963f\u514b\u82cf",80.26026916503906,41.16864013671875],[659002,"\u963f\u62c9\u5c14",81.2806396484375,40.547969818115234],[152900,"\u963f\u62c9\u5584\u76df",105.72894287109375,38.85150146484375],[654300,"\u963f\u52d2\u6cf0",88.13829803466797,47.849849700927734],[542500,"\u963f\u91cc\u5730\u533a",81.1456298828125,30.400529861450195],[610900,"\u5b89\u5eb7",109.02745819091797,32.68914031982422]],"B":[[110100,"\u5317\u4eac",116.41210174560547,39.90364074707031],[130600,"\u4fdd\u5b9a",115.4645004272461,38.8739013671875],[610300,"\u5b9d\u9e21",107.23729705810547,34.36193084716797],[150200,"\u5305\u5934",109.84111785888672,40.65727996826172],[210500,"\u672c\u6eaa",123.76766967773438,41.294281005859375],[450500,"\u5317\u6d77",109.11990356445312,21.481220245361328],[340300,"\u868c\u57e0",117.3884506225586,32.91548156738281],[220800,"\u767d\u57ce",122.838623046875,45.61954116821289],[652800,"\u5df4\u97f3\u90ed\u695e",86.14511108398438,41.76401138305664],[469025,"\u767d\u6c99",109.4537582397461,19.224079132080078],[220600,"\u767d\u5c71",126.4237289428711,41.940120697021484],[620400,"\u767d\u94f6",104.13768768310547,36.54467010498047],[451000,"\u767e\u8272",106.61775970458984,23.90329933166504],[469029,"\u4fdd\u4ead",{},{}],[530500,"\u4fdd\u5c71",99.16179656982422,25.11203956604004],[522400,"\u6bd5\u8282\u5730\u533a",105.28411102294922,27.302650451660156],[371600,"\u6ee8\u5dde",117.9822006225586,37.376888275146484],[341600,"\u4eb3\u5dde",115.78057098388672,33.852291107177734],[150800,"\u5df4\u5f66\u6dd6\u5c14",107.38829803466797,40.74287033081055],[511900,"\u5df4\u4e2d",106.74478149414062,31.865110397338867]],"C":[[500100,"\u91cd\u5e86",106.5521469116211,29.562820434570312],[510100,"\u6210\u90fd",104.0647201538086,30.65867042541504],[430100,"\u957f\u6c99",112.93878173828125,28.227720260620117],[220100,"\u957f\u6625",125.3235092163086,43.81612014770508],[320400,"\u5e38\u5dde",119.97396087646484,31.80994987487793],[130800,"\u627f\u5fb7",117.94400024414062,40.97806167602539],[130900,"\u6ca7\u5dde",116.838623046875,38.30498123168945],[341100,"\u6ec1\u5dde",118.31688690185547,32.30181121826172],[1341700,"\u6c60\u5dde",{},{}],[150400,"\u8d64\u5cf0",118.88912963867188,42.25831985473633],[542100,"\u660c\u90fd\u5730\u533a",97.17769622802734,31.141010284423828],[652300,"\u660c\u5409\u5dde",87.30815887451172,44.011138916015625],[140400,"\u957f\u6cbb",113.11795043945312,36.195560455322266],[430700,"\u5e38\u5fb7",111.6985092163086,29.03158950805664],[341400,"\u5de2\u6e56",117.88571166992188,31.619159698486328],[211300,"\u671d\u9633",120.44992065429688,41.57365036010742],[445100,"\u6f6e\u5dde",116.62288665771484,23.65665054321289],[431000,"\u90f4\u5dde",113.0145492553711,25.770540237426758],[451400,"\u5d07\u5de6",107.36638641357422,22.37652015686035],[532300,"\u695a\u96c4",101.52803802490234,25.04538917541504]],"D":[[210200,"\u5927\u8fde",121.61470794677734,38.913631439208984],[441900,"\u4e1c\u839e",113.75151824951172,23.019929885864258],[140200,"\u5927\u540c",113.3000717163086,40.07632827758789],[370500,"\u4e1c\u8425",118.67462158203125,37.43360900878906],[532900,"\u5927\u7406",100.26757049560547,25.606420516967773],[230600,"\u5927\u5e86",125.10324096679688,46.58930969238281],[210600,"\u4e39\u4e1c",124.384521484375,40.12916946411133],[533100,"\u5fb7\u5b8f",98.58480072021484,24.432289123535156],[510600,"\u5fb7\u9633",104.39755249023438,31.126680374145508],[371400,"\u5fb7\u5dde",116.30269622802734,37.4511604309082],[511700,"\u8fbe\u5dde",107.47225952148438,31.21441078186035],[232700,"\u5927\u5174\u5b89\u5cad",124.30953979492188,51.981441497802734],[533400,"\u8fea\u5e86",99.70297241210938,27.819150924682617],[621100,"\u5b9a\u897f",104.62619018554688,35.58047866821289]],"E":[[150600,"\u9102\u5c14\u591a\u65af",110.02169036865234,39.818031311035156],[420700,"\u9102\u5dde",114.8927001953125,30.39423942565918],[422800,"\u6069\u65bd",109.48812103271484,30.27212905883789]],"F":[[350100,"\u798f\u5dde",119.29650115966797,26.073970794677734],[440600,"\u4f5b\u5c71",113.1217269897461,23.024370193481445],[210400,"\u629a\u987a",123.9542465209961,41.878658294677734],[361000,"\u629a\u5dde",116.35283660888672,27.94499969482422],[210900,"\u961c\u65b0",121.66963958740234,42.02191162109375],[341200,"\u961c\u9633",115.8139877319336,32.88970184326172],[450600,"\u9632\u57ce\u6e2f",108.35399627685547,21.687089920043945]],"G":[[440100,"\u5e7f\u5dde",113.26525115966797,23.128700256347656],[450300,"\u6842\u6797",110.29000091552734,25.273330688476562],[520100,"\u8d35\u9633",106.63011932373047,26.647249221801758],[360700,"\u8d63\u5dde",114.93331146240234,25.829099655151367],[623000,"\u7518\u5357",102.91197967529297,34.98358154296875],[513300,"\u7518\u5b5c",101.9630126953125,30.050800323486328],[640400,"\u56fa\u539f",106.2425537109375,36.01578140258789],[511600,"\u5e7f\u5b89",106.63311004638672,30.455890655517578],[510800,"\u5e7f\u5143",105.84358978271484,32.43511962890625],[450800,"\u8d35\u6e2f",109.59677124023438,23.10671043395996],[632600,"\u679c\u6d1b",100.24484252929688,34.471439361572266]],"H":[[330100,"\u676d\u5dde",120.15509033203125,30.27298927307129],[340100,"\u5408\u80a5",117.22775268554688,31.820430755615234],[230100,"\u54c8\u5c14\u6ee8",126.53511810302734,45.80329895019531],[460100,"\u6d77\u53e3",110.3359603881836,20.031349182128906],[150100,"\u547c\u548c\u6d69\u7279",111.7499008178711,40.84267044067383],[130400,"\u90af\u90f8",114.49340057373047,36.61172866821289],[330500,"\u6e56\u5dde",120.08688354492188,30.893770217895508],[341000,"\u9ec4\u5c71",118.33882904052734,29.715410232543945],[441300,"\u60e0\u5dde",114.41680145263672,23.111160278320312],[320800,"\u6dee\u5b89",119.0155029296875,33.61022186279297],[211400,"\u846b\u82a6\u5c9b",120.83592987060547,40.70981979370117],[421100,"\u9ec4\u5188",114.87529754638672,30.454519271850586],[420200,"\u9ec4\u77f3",115.03790283203125,30.19927978515625],[231100,"\u9ed1\u6cb3",127.51904296875,50.24803924560547],[430400,"\u8861\u9633",112.57186126708984,26.89318084716797],[441600,"\u6cb3\u6e90",114.70062255859375,23.743589401245117],[340400,"\u6dee\u5357",117.0029296875,32.62474822998047],[451100,"\u8d3a\u5dde",111.5675277709961,24.402280807495117],[340600,"\u6dee\u5317",116.79827117919922,33.95473861694336],[610700,"\u6c49\u4e2d",107.02342987060547,33.06753921508789],[150700,"\u547c\u4f26\u8d1d\u5c14",119.76608276367188,49.21223831176758],[371700,"\u83cf\u6cfd",115.4798812866211,35.2353401184082],[431200,"\u6000\u5316",109.99826049804688,27.555519104003906],[131100,"\u8861\u6c34",115.69686126708984,37.73678970336914],[632800,"\u6d77\u897f",97.16259002685547,37.38842010498047],[652200,"\u54c8\u5bc6\u5730\u533a",93.51561737060547,42.81884002685547],[451200,"\u6cb3\u6c60",108.0859603881836,24.692869186401367],[632200,"\u6d77\u5317",100.9009017944336,36.954498291015625],[632100,"\u6d77\u4e1c\u5730\u533a",102.11044311523438,36.506988525390625],[632500,"\u6d77\u5357\u5dde",100.62042236328125,36.286380767822266],[653200,"\u548c\u7530\u5730\u533a",79.93112182617188,37.11376953125],[410600,"\u9e64\u58c1",114.18417358398438,35.900489807128906],[230400,"\u9e64\u5c97",130.29815673828125,47.34986877441406],[532500,"\u7ea2\u6cb3",103.37554168701172,23.36417007446289],[632300,"\u9ec4\u5357",102.10408782958984,35.5217399597168]],"J":[[370100,"\u6d4e\u5357",116.99520111083984,36.66537857055664],[330400,"\u5609\u5174",120.74832153320312,30.745149612426758],[330700,"\u91d1\u534e",119.64749145507812,29.0781192779541],[440700,"\u6c5f\u95e8",113.08177947998047,22.57879066467285],[370800,"\u6d4e\u5b81",116.58737182617188,35.41448974609375],[421000,"\u8346\u5dde",112.23953247070312,30.334510803222656],[220200,"\u5409\u6797",126.54940032958984,43.83771896362305],[360400,"\u4e5d\u6c5f",116.00137329101562,29.705400466918945],[210700,"\u9526\u5dde",121.13524627685547,41.093990325927734],[360200,"\u666f\u5fb7\u9547",117.18170166015625,29.30706024169922],[230800,"\u4f73\u6728\u65af",130.3203125,46.79930877685547],[230300,"\u9e21\u897f",130.97354125976562,45.2982292175293],[360800,"\u5409\u5b89",114.99349975585938,27.11383056640625],[419001,"\u6d4e\u6e90",{},{}],[410800,"\u7126\u4f5c",113.2419662475586,35.21559143066406],[445200,"\u63ed\u9633",116.37261962890625,23.549640655517578],[620300,"\u91d1\u660c",102.18759155273438,38.52265930175781],[140500,"\u664b\u57ce",112.85164642333984,35.49037170410156],[140700,"\u664b\u4e2d",112.751220703125,37.68722915649414],[420800,"\u8346\u95e8",112.19940185546875,31.035400390625],[620900,"\u9152\u6cc9",98.49388885498047,39.73823165893555],[620200,"\u5609\u5cea\u5173",98.2896728515625,39.77191162109375]],"K":[[530100,"\u6606\u660e",102.72216033935547,25.037879943847656],[410200,"\u5f00\u5c01",114.3072509765625,34.797218322753906],[653100,"\u5580\u4ec0\u5730\u533a",75.98970794677734,39.47037124633789],[650200,"\u514b\u62c9\u739b\u4f9d",84.88912963867188,45.57938003540039],[653000,"\u514b\u5b5c\u52d2\u82cf",76.1668701171875,39.71649169921875]],"L":[[620100,"\u5170\u5dde",103.83409881591797,36.06135940551758],[530700,"\u4e3d\u6c5f",100.22640991210938,26.85474967956543],[131000,"\u5eca\u574a",116.7064208984375,39.52069091796875],[410300,"\u6d1b\u9633",112.4531478881836,34.618038177490234],[320700,"\u8fde\u4e91\u6e2f",119.22174072265625,34.595211029052734],[511100,"\u4e50\u5c71",103.76531982421875,29.552160263061523],[540100,"\u62c9\u8428",91.11434173583984,29.644060134887695],[451300,"\u6765\u5bbe",109.22293090820312,23.74803924560547],[371200,"\u83b1\u829c",117.67552947998047,36.21493911743164],[331100,"\u4e3d\u6c34",119.92288208007812,28.467159271240234],[513400,"\u51c9\u5c71",102.26776123046875,27.881040573120117],[211000,"\u8fbd\u9633",123.17279052734375,41.269649505615234],[220400,"\u8fbd\u6e90",125.1435775756836,42.88801956176758],[450200,"\u67f3\u5dde",109.41539764404297,24.32537078857422],[371300,"\u4e34\u6c82",118.34935760498047,35.0536003112793],[371500,"\u804a\u57ce",115.98538208007812,36.45587921142578],[542600,"\u6797\u829d",94.35997772216797,29.672420501708984],[530900,"\u4e34\u6ca7",100.07946014404297,23.877599716186523],[141000,"\u4e34\u6c7e",111.51763153076172,36.08763885498047],[622900,"\u4e34\u590f",103.21099090576172,35.601409912109375],[341500,"\u516d\u5b89",116.50554656982422,31.744670867919922],[520200,"\u516d\u76d8\u6c34",104.83099365234375,26.592649459838867],[350800,"\u9f99\u5ca9",117.03411102294922,25.10062026977539],[621200,"\u9647\u5357",104.9222412109375,33.39897918701172],[431300,"\u5a04\u5e95",111.9945297241211,27.6972599029541],[510500,"\u6cf8\u5dde",105.44249725341797,28.871639251708984],[141100,"\u5415\u6881",111.14404296875,37.518489837646484],[411100,"\u6f2f\u6cb3",114.0167465209961,33.581459045410156]],"M":[[340500,"\u9a6c\u978d\u5c71",118.50463104248047,31.697280883789062],[440900,"\u8302\u540d",110.9251708984375,21.663240432739258],[511400,"\u7709\u5c71",103.84844970703125,30.07546043395996],[441400,"\u6885\u5dde",116.1223373413086,24.288530349731445],[510700,"\u7ef5\u9633",104.6793212890625,31.467220306396484],[231000,"\u7261\u4e39\u6c5f",129.61961364746094,44.588539123535156]],"N":[[320100,"\u5357\u4eac",118.79637908935547,32.05830001831055],[330200,"\u5b81\u6ce2",121.54974365234375,29.874040603637695],[360100,"\u5357\u660c",115.85845184326172,28.6830997467041],[450100,"\u5357\u5b81",108.36650848388672,22.816320419311523],[320600,"\u5357\u901a",120.89337158203125,31.98232078552246],[511300,"\u5357\u5145",106.11064910888672,30.83724021911621],[511000,"\u5185\u6c5f",105.05859375,29.580400466918945],[542400,"\u90a3\u66f2",92.06072998046875,31.473970413208008],[350700,"\u5357\u5e73",118.17772674560547,26.641450881958008],[411300,"\u5357\u9633",112.52847290039062,32.99087142944336],[350900,"\u5b81\u5fb7",119.52632904052734,26.666419982910156],[533300,"\u6012\u6c5f",98.85269165039062,25.855180740356445]],"P":[[510400,"\u6500\u679d\u82b1",101.71749114990234,26.58237075805664],[211100,"\u76d8\u9526",122.07208251953125,41.12063980102539],[410400,"\u5e73\u9876\u5c71",113.3092269897461,33.72663879394531],[620800,"\u5e73\u51c9",106.6649398803711,35.54214859008789],[360300,"\u840d\u4e61",113.85513305664062,27.622190475463867],[350300,"\u8386\u7530",119.0075912475586,25.453929901123047],[410900,"\u6fee\u9633",115.03244018554688,35.75920867919922],[530800,"\u666e\u6d31",100.9702377319336,22.78215980529785]],"Q":[[370200,"\u9752\u5c9b",120.38289642333984,36.066158294677734],[350500,"\u6cc9\u5dde",118.58696746826172,24.907360076904297],[130300,"\u79e6\u7687\u5c9b",119.60186004638672,39.935638427734375],[330800,"\u8862\u5dde",118.87349700927734,28.93609046936035],[441800,"\u6e05\u8fdc",113.05615234375,23.681739807128906],[621000,"\u5e86\u9633",107.63298797607422,35.73843002319336],[230200,"\u9f50\u9f50\u54c8\u5c14",123.91716766357422,47.354408264160156],[429005,"\u6f5c\u6c5f",112.89913177490234,30.402179718017578],[522600,"\u9ed4\u4e1c\u5357",107.97476196289062,26.585119247436523],[522700,"\u9ed4\u5357",107.52220916748047,26.254230499267578],[522300,"\u9ed4\u897f\u5357",104.90657806396484,25.087989807128906],[450700,"\u94a6\u5dde",108.65408325195312,21.980810165405273],[530300,"\u66f2\u9756",103.79617309570312,25.48995018005371],[230900,"\u4e03\u53f0\u6cb3",131.00302124023438,45.7706298828125]],"R":[[542300,"\u65e5\u5580\u5219",88.88134002685547,29.266820907592773],[371100,"\u65e5\u7167",119.53204345703125,35.41115188598633]],"S":[[310100,"\u4e0a\u6d77",121.4745101928711,31.230649948120117],[440300,"\u6df1\u5733",114.05780029296875,22.54290008544922],[210100,"\u6c88\u9633",123.43182373046875,41.80622863769531],[130100,"\u77f3\u5bb6\u5e84",114.5146713256836,38.04273986816406],[320500,"\u82cf\u5dde",120.58541107177734,31.29878044128418],[460200,"\u4e09\u4e9a",109.51116180419922,18.252399444580078],[330600,"\u7ecd\u5174",120.57785034179688,30.004470825195312],[440500,"\u6c55\u5934",116.68184661865234,23.351520538330078],[440200,"\u97f6\u5173",113.59716033935547,24.81022071838379],[411200,"\u4e09\u95e8\u5ce1",111.20027923583984,34.77259063720703],[350400,"\u4e09\u660e",117.63912963867188,26.263830184936523],[542200,"\u5c71\u5357\u5730\u533a",91.7756576538086,29.225130081176758],[441500,"\u6c55\u5c3e",115.37545013427734,22.7857608795166],[611000,"\u5546\u6d1b",109.93498992919922,33.87001037597656],[411400,"\u5546\u4e18",115.65132904052734,34.44684982299805],[361100,"\u4e0a\u9976",117.97589111328125,28.44384002685547],[430500,"\u90b5\u9633",111.4677734375,27.240009307861328],[420300,"\u5341\u5830",110.7888412475586,32.65066909790039],[640200,"\u77f3\u5634\u5c71",106.36813354492188,39.019100189208984],[230500,"\u53cc\u9e2d\u5c71",131.1590576171875,46.646541595458984],[140600,"\u6714\u5dde",112.43295288085938,39.33129119873047],[220300,"\u56db\u5e73",124.34993743896484,43.165950775146484],[220700,"\u677e\u539f",124.82489013671875,45.14125061035156],[321300,"\u5bbf\u8fc1",118.27542114257812,33.96187973022461],[341300,"\u5bbf\u5dde",116.96385955810547,33.64611053466797],[231200,"\u7ee5\u5316",126.9685287475586,46.65386962890625],[421300,"\u968f\u5dde",113.38240814208984,31.69021987915039],[510900,"\u9042\u5b81",105.56784057617188,30.525489807128906]],"T":[[120100,"\u5929\u6d25",117.21446990966797,39.12080001831055],[140100,"\u592a\u539f",112.55075073242188,37.870540618896484],[130200,"\u5510\u5c71",118.18048095703125,39.630531311035156],[331000,"\u53f0\u5dde",121.4206771850586,28.65428924560547],[654200,"\u5854\u57ce",82.98416137695312,46.748939514160156],[370900,"\u6cf0\u5b89",117.08748626708984,36.2000617980957],[321200,"\u6cf0\u5dde",119.92294311523438,32.454830169677734],[620500,"\u5929\u6c34",105.72509002685547,34.582359313964844],[211200,"\u94c1\u5cad",123.84542083740234,42.28649139404297],[220500,"\u901a\u5316",125.93991088867188,41.72819900512695],[150500,"\u901a\u8fbd",122.26616668701172,43.61922073364258],[610200,"\u94dc\u5ddd",108.9450912475586,34.89667892456055],[340700,"\u94dc\u9675",117.8203125,30.937599182128906],[522200,"\u94dc\u4ec1",109.16011810302734,27.691560745239258],[652100,"\u5410\u9c81\u756a",89.18730926513672,42.958900451660156]],"W":[[320200,"\u65e0\u9521",120.30281829833984,31.56591033935547],[420100,"\u6b66\u6c49",114.30522918701172,30.592769622802734],[650100,"\u4e4c\u9c81\u6728\u9f50",87.61653900146484,43.82643127441406],[330300,"\u6e29\u5dde",120.69931030273438,27.994850158691406],[371000,"\u5a01\u6d77",122.12374114990234,37.510009765625],[370700,"\u6f4d\u574a",119.16171264648438,36.70682144165039],[340200,"\u829c\u6e56",118.38524627685547,31.339189529418945],[610500,"\u6e2d\u5357",109.51024627685547,34.49951171875],[532600,"\u6587\u5c71",104.25145721435547,23.368419647216797],[150300,"\u4e4c\u6d77",106.82388305664062,39.68434143066406],[150900,"\u4e4c\u5170\u5bdf\u5e03",113.13375091552734,40.994140625],[640300,"\u5434\u5fe0",106.19873046875,37.99750900268555],[450400,"\u68a7\u5dde",111.2788314819336,23.477699279785156],[620600,"\u6b66\u5a01",102.63780975341797,37.931739807128906]],"X":[[610100,"\u897f\u5b89",108.94412231445312,34.264801025390625],[350200,"\u53a6\u95e8",118.0893783569336,24.479530334472656],[320300,"\u5f90\u5dde",117.1915512084961,34.259761810302734],[630100,"\u897f\u5b81",101.77780151367188,36.61722183227539],[532800,"\u897f\u53cc\u7248\u7eb3",100.7976303100586,22.007179260253906],[152500,"\u9521\u6797\u90ed\u52d2",116.04769134521484,43.93315887451172],[421200,"\u54b8\u5b81",114.322021484375,29.84086036682129],[610400,"\u54b8\u9633",108.70967864990234,34.3290901184082],[430300,"\u6e58\u6f6d",112.9429931640625,27.830129623413086],[433100,"\u6e58\u897f",109.7388916015625,28.311800003051758],[420600,"\u8944\u6a0a",112.15408325195312,32.02267837524414],[420900,"\u5b5d\u611f",113.91635131835938,30.924739837646484],[140900,"\u5ffb\u5dde",112.73770141601562,38.41572952270508],[360500,"\u65b0\u4f59",114.9165267944336,27.81822967529297],[411500,"\u4fe1\u9633",114.0686264038086,32.12303924560547],[152200,"\u5174\u5b89\u76df",122.06304168701172,46.07875061035156],[130500,"\u90a2\u53f0",114.50493621826172,37.07059097290039],[411000,"\u8bb8\u660c",113.85228729248047,34.03565979003906],[341800,"\u5ba3\u57ce",118.7585678100586,30.940710067749023]],"Y":[[321000,"\u626c\u5dde",119.41354370117188,32.39379119873047],[610600,"\u5ef6\u5b89",109.48973846435547,36.58546829223633],[640100,"\u94f6\u5ddd",106.23251342773438,38.488948822021484],[511800,"\u96c5\u5b89",103.01318359375,29.980459213256836],[370600,"\u70df\u53f0",121.4476318359375,37.463558197021484],[222400,"\u5ef6\u8fb9",129.509033203125,42.89128875732422],[320900,"\u76d0\u57ce",120.16168212890625,33.354408264160156],[441700,"\u9633\u6c5f",111.98248291015625,21.858230590820312],[140300,"\u9633\u6cc9",113.58040618896484,37.85663986206055],[230700,"\u4f0a\u6625",128.90399169921875,47.72737121582031],[654000,"\u4f0a\u7281",81.32746887207031,43.919368743896484],[511500,"\u5b9c\u5bbe",104.64334106445312,28.751750946044922],[420500,"\u5b9c\u660c",111.28685760498047,30.69202995300293],[360900,"\u5b9c\u6625",114.41000366210938,27.817169189453125],[430900,"\u76ca\u9633",112.3551025390625,28.553869247436523],[360600,"\u9e70\u6f6d",117.06912231445312,28.260129928588867],[210800,"\u8425\u53e3",122.23486328125,40.666778564453125],[431100,"\u6c38\u5dde",111.61392211914062,26.42160987854004],[610800,"\u6986\u6797",109.7345199584961,38.28517150878906],[450900,"\u7389\u6797",110.16455078125,22.63619041442871],[632700,"\u7389\u6811",97.01708984375,33.02265930175781],[530400,"\u7389\u6eaa",102.5465316772461,24.35186004638672],[430600,"\u5cb3\u9633",113.12698364257812,29.3570499420166],[445300,"\u4e91\u6d6e",112.04454803466797,22.91489028930664],[140800,"\u8fd0\u57ce",111.00691986083984,35.026241302490234]],"Z":[[410100,"\u90d1\u5dde",113.6246337890625,34.74673843383789],[440400,"\u73e0\u6d77",113.57672119140625,22.270910263061523],[442000,"\u4e2d\u5c71",113.39253997802734,22.515859603881836],[330900,"\u821f\u5c71",122.20773315429688,29.985349655151367],[321100,"\u9547\u6c5f",119.45674896240234,32.20021057128906],[30700,"\u5f20\u5bb6\u53e3",{},{}],[370400,"\u67a3\u5e84",117.32357025146484,34.81003952026367],[440800,"\u6e5b\u6c5f",110.3593978881836,21.270729064941406],[430800,"\u5f20\u5bb6\u754c",110.48001098632812,29.11557960510254],[1620700,"\u5f20\u6396",{},{}],[350600,"\u6f33\u5dde",117.64714813232422,24.513399124145508],[530600,"\u662d\u901a",103.71533203125,27.337890625],[441200,"\u8087\u5e86",112.46533203125,23.047029495239258],[640500,"\u4e2d\u536b",105.1736068725586,37.51694869995117],[411600,"\u5468\u53e3",114.65328979492188,33.623138427734375],[430200,"\u682a\u6d32",113.13442993164062,27.82784080505371],[411700,"\u9a7b\u9a6c\u5e97",114.0356674194336,32.981868743896484],[512000,"\u8d44\u9633",104.62857055664062,30.13071060180664],[370300,"\u6dc4\u535a",118.05499267578125,36.81282043457031],[510300,"\u81ea\u8d21",104.77828979492188,29.338939666748047],[520300,"\u9075\u4e49",106.9271469116211,27.725400924682617]]}
	
	function CityAll() {
		return {
			wrap: city_all_panel,
			init: function(arg1) {
				var _this = this;

				_this.role = arg1; //index首页，delivery外卖

				_this.initHandler();
			},
			initHandler: function(){
				this._renderStatic();
			},
			setAfterPageOut: function(){
				//切换完成后销毁
				dd.lib.memCache.removeValue('update_city');
			},
			//静态模板
			_renderStatic: function(){
				var _this = this;

				_this._buildList();
			},
			//渲染城市列表
			_buildList: function(){
				var _this = this;
				_this.alt = History.getState().data.referer || 'index';
				var options = {
					'listObj': CITY_ALL_DATA,
					'alt': _this.alt
				}

				var tpl = dd.ui.tmpl(tpl_city_all.html(), options);
				_this.startUp(tpl);
			},
			startUp: function(tpl) {
                city_all_panel.html(tpl);
            },
            events: [
                [dd.event.click, '.J_city_item', '_itemHandler']
            ],
            _itemHandler: function(e,el){
            	var cdata = $(el).attr('data-data').split(';');

            	//更新过城市
            	//console.log(typeof cdata[0]+' '+typeof History.getState().data.referer_citycode)
            	if(cdata[0] != History.getState().data.referer_citycode) {
            		dd.lib.memCache.set('address_operate_city', $(el).attr('data-data').split(';'));
					dd.lib.memCache.set('update_city', true);
            	}

				var state_obj = {
                    'back': {
                        'ddid': this.alt
                    }
                };
                dd.lib.ddState(state_obj);
            }
		}
	}

	dd.app.CityAll = function() {
		return new CityAll;
	};
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-外卖列表
 */
(function ($, window, dd) {
    var doc = window.document,
        bridge = window.bridge;

    var delivery_panel = $('#J_delivery');

    //script模板
    var tpl_delivery = $('#J_tpl_delivery'),
        tpl_delivery_enter = $('#J_tpl_delivery_enter');

    //存储访问过的店铺
    var carte_data = {}, //菜单数据
        item_data = {}, //商品数据
        inorder_data = {}, //下单总计数据
        cate_data; //类目数据

    var slide_config = {
        wrap: undefined,
        x: undefined,
        max: undefined,
        unit: undefined
    };

    var async = false; //异步标识

    var History = window.History;

    var storage = window.localStorage;

    function Delivery() {
        return {
            wrap: delivery_panel,
            init: function (arg1) {
                var _this = this;
                _this.search_key = arg1;
                _this.delivery_filter_data = dd.lib.memCache.get('delivery_filter_data') || _this._filterDataReset();

                if (_this.search_key) {
                    _this.delivery_filter_data.key = _this.search_key;
                }
                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setBeforePageOut: function (i, o) {
                if (!/index/.test(i)) {
                    this.scroll_top = doc.body.scrollTop;
                }
                doc.body.scrollTop = 0;
            },
            setAfterPageOut: function (i, o) {
                if (/index/.test(i)) {
                    //回首页 清理筛选数据
                    this.delivery_filter_data = this._filterDataReset();
                    dd.lib.memCache.set('delivery_filter_data', this.delivery_filter_data)
                }
                //this._Scroll && this._Scroll.loadDisable();
            },
            setBeforePageIn: function (i, o) {
            },
            setAfterPageIn: function (i, o) {
                //来自地址更新
                if (dd.lib.memCache.get('update_delivery')) {
                    this.delivery_filter_data = this.delivery_filter_data || this._filterDataReset();
                    this.delivery_filter_data.city = dd.lib.localStorage.get('default_address')
                        .citycode;
                    //更新距离提示
                    dd.lib.memCache.removeValue('disHasTip');

                    this._addressHandler();

                    this._distanceTip();
                }

                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: 'http://g.dd.alicdn.com/tps/i2/T12wwaFRXXXXa2FNje-36-35.png'
                }, function () {
                });
            },
            _filterDataReset: function () {
                return {
                    'taste': '口味不限',
                    'taste_id': '0',
                    'sort': '默认排序',
                    'sort_id': 0,
                    'filte': '送餐费不限',
                    'filte_v': 0, //0不限，1免费，2无起送金额
                    'city': '',
                    'key': ''
                }
            },
            //静态模板
            _renderStatic: function () {
                //loading
                this.wrap.html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                //hack for 2 times load(setBeforePageIn && init)
                if (!dd.lib.memCache.get('update_delivery')) {
                    _this._addressHandler();
                }
            },
            _addressHandler: function () {
                var _this = this;

                _this.state = History.getState();
                _this.state_data = _this.state.data.data;

                _this.default_address = dd.lib.localStorage.get('default_address'); //地址数据

                _this.page = {
                    current: 1, //当前页
                    total: 0, //总条数
                    pz: 20 //每页条数
                }

                if (_this.default_address) {
                    _this.delivery_filter_data.city = _this.default_address.citycode;
                    _this._buildTmpl();

                    //_this._takeoutStoreList();
                    return;
                }

                //查询默认地址
                lib.mtop.request({
                    api: 'mtop.life.diandian.getDefaultUserAddressById',
                    v: '1.0',
                    data: {},
                    extParam: {}
                }, function (data) {
                    if (data.data) {
                        //刷新&不存在地址
                        dd.lib.localStorage.set('default_address', data.data.model);
                        _this.default_address = data.data.model;

                        /*_this.delivery_filter_data = {

                         }*/
                        _this.delivery_filter_data.city = _this.default_address.citycode;

                        _this._buildTmpl();
                        _this._distanceTip();

                    }
                }, function (data) {
                    //没有默认地址
                    _this._buildEnterTmpl();
                });
            },
            _buildTmpl: function () {
                var _this = this;

                //筛选数据
                _this.state = History.getState();
                _this.state_data = _this.state.data.data;
                //_this.delivery_filter_data = dd.lib.memCache.get('delivery_filter_data');
                dd.lib.memCache.set('delivery_filter_data', _this.delivery_filter_data);

                var options = {
                    //'storeList': data.storeList,
                    //'totalCount': data.totalCount,
                    'address': _this.default_address,
                    'taste': _this.delivery_filter_data.taste,
                    'sort': _this.delivery_filter_data.sort,
                    'sort_id': _this.delivery_filter_data.sort_id,
                    'filte': _this.delivery_filter_data.filte,
                    'filte_v': _this.delivery_filter_data.filte_v,
                    //'page_total': _this.page_total,
                    'key': _this.delivery_filter_data.key,
                    'swipeid': History.getState().data.referer || 'index'
                }
                //渲染
                var tpl = dd.ui.tmpl(tpl_delivery.html(), options);
                _this.wrap.html(tpl);

                _this.delivery_filter_subclass = $('#J_delivery_filter_subclass'),
                    _this.delivery_mask = $('#J_delivery_mask');

                _this.pulldown_el = _this.wrap.find('.J_pulldown'),
                    _this.pullup_el = _this.wrap.find('.J_pullUp');


                /*setTimeout(function(){
                 _this._iScrollInit();
                 }, dd.ui.appinterval);*/

                _this._takeoutStoreList('refresh');
                _this._takeoutShopCategoryList();

                //_this.manualHandler();

                _this.wrap.find('#J_delivery_list').html(dd.ui.tpl.load);

                //更新titleBar内容
                if (dd._hideTitleBar) {
                    bridge.push("setTitle", {
                        title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                    });
                }
            },
            _takeoutStoreList: function (role) {
                //外卖信息
                var _this = this;

                async = true;
                var map = {
                    remark: ["page=", _this.page.current, ",pageSize=", _this.page.pz, ",src=0"].join(""),
                    rn: lib.encode.md5(Date.now() + Math.random().toString(32)).toLowerCase()
                }
                lib.mtop.request({
                    api: 'mtop.life.diandian.takeoutStoreList',
                    v: '1.0',
                    data: {
                        x: parseFloat(_this.default_address.posx),
                        y: parseFloat(_this.default_address.posy),
                        taste: parseInt(_this.delivery_filter_data.taste_id),
                        minp: 0,
                        maxp: 0,
                        o: parseInt(_this.delivery_filter_data.sort_id),
                        filte: _this.delivery_filter_data.filte_v,
                        key: _this.delivery_filter_data.key,
                        p: _this.page.current,
                        pz: _this.page.pz,
                        city: _this.delivery_filter_data.city,
                        statisticsInfo: JSON.stringify(map)
                    }
                }, function (data) {
                    if (data.data) {
                        _this.page.total = Math.ceil(parseInt(data.data.totalCount) / _this.page.pz);
                        _this._buildLi({'storeList': data.data.storeList}, role);
                    }
                    async = false;
                }, function (data) {
                    dd.ui.toast(data, _this);
                    async = false;
                });
            },
            //渲染列表
            _buildLi: function (data, role) {
                var _this = this, tpl;

                if (data && data.storeList && data.storeList.length) {
                    tpl = dd.ui.tmpl($('#J_tpl_delivery_carteli').html(), data);
                } else {
                    tpl = "<div class='no_content'><i></i>没有外卖能送到您的配送地址</div>";
                }

                if (role == 'refresh') {
                    _this.wrap.find('#J_delivery_list').empty();
                }
                _this.startUp(tpl);

                if (role == 'refresh') {
                    //是否翻页
                    if (_this.page.total > 1) {
                        _this.pullup_el.removeClass('dn');
                    } else {
                        _this.pullup_el.addClass('dn');
                    }

                    setTimeout(function () {
                        _this._scrollInit();
                    }, 0)
                } else {
                    //是否最后页
                    if (_this.page.current >= _this.page.total) {
                        _this.pullup_el.addClass('dn');
                    }

                    _this._scroll.refresh();
                }

            },
            _distanceTip: function () {
                var _this = this;
                if (!dd.lib.memCache.get('disHasTip')) {
                    if (!dd.lib.memCache.get('geo_location')) {
                        dd.lib.getH5Geo({
                            'callback': function (pos) {
                                if (pos.latitude) {
                                    if (dd.lib.getUriParam(History.getState().url, '_ddid') == 'delivery') {
                                        //确保用户还在外卖页
                                        _this._distanceHandler();
                                    }
                                }
                            }
                        })
                    } else {
                        _this._distanceHandler();
                    }
                }
            },
            _distanceHandler: function () {
                var _this = this,
                    current_city = dd.lib.memCache.get("geo_location") || dd.lib.localStorage.get("current_city");

                var geo = {
                        'longitude': current_city.longitude,
                        'latitude': current_city.latitude
                    },
                    point = {
                        'longitude': _this.default_address.posx,
                        'latitude': _this.default_address.posy
                    }
                var dis = dd.lib.geoDistance(geo, point);

                if (dis > parseInt(dd.config.waimai.tip.waimai_tip_distance)) {
                    setTimeout(function () {
                        bridge.push('confirm', {
                            title: '提示',
                            message: '送餐地址和您当前位置相距' + dd.lib.num2Fixed(dis / 1000, 1) + '千米',
                            okButton: '确定',
                            cancelButton: '修改送餐地址'
                        }, function (result) {
                            if (!result.ok) {
                                dd.lib.ddState({
                                    'push': {
                                        'ddid': 'address/' + _this.default_address.id,
                                        'obj': {
                                            'referer': 'delivery'
                                        }
                                    }
                                })
                            }
                        });
                        dd.lib.memCache.set('disHasTip', 'true');
                    }, 100)

                }
            },
            startUp: function (tpl) {
                this.wrap.find('#J_delivery_list').append(tpl);
            },
            events: [
                [dd.event.click, '.J_delivery_item', '_itemHandler'],
                [dd.event.click, '#J_delivery_search', '_searchHandler'],
                [dd.event.click, '#J_delivery_sort li', '_sortHandler'],
                [dd.event.click, '#J_delivery_filte_list li', '_filteHandler'],
                [dd.event.click, '.J_subject_filter', '_subjectFilterHandler'],
                [dd.event.click, '#J_delivery_mask', '_maskHandler']
            ],
            menuEvent: '_searchHandler',
            //点击店铺
            _itemHandler: function (e, el) {
                var ddid = $(el).attr('data-swipeid');

                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'referer': 'delivery',
                            'default_address': this.default_address
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },
            //搜索触发
            _searchHandler: function (e, el) {
                var ddid = 'search/delivery';
                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'deliveryData': this.delivery_filter_data,
                            'default_address': this.default_address,
                            'referer': 'delivery'
                        }
                    }
                };
                $('#J_search').removeAttr('data-ddid');
                dd.lib.ddState(state_obj);
            },
            //显示筛选
            _subjectFilterHandler: function (e, el) {
                var _this = this;
                if (async) {
                    return;
                }

                if ($(el).hasClass('current')) {
                    _this._filterkHide();
                    return
                }

                var type = $(el).data('type'),
                    index = $(el).index();

                _this.delivery_mask.show();

                setTimeout(function () {
                    _this.delivery_filter_subclass.attr('class', 'filter_subclass subclass_' + type).show();
                }, 0)

                $(el).addClass('current').siblings('.current').removeClass('current');

                //_this.mainScroll.disable();
                //this._Scroll.touchDisable();
                this._scroll.disable();
            },
            _maskHandler: function (e, el) {
                this._filterkHide();
            },
            //人均筛选
            _sortHandler: function (e, el) {
                $(el).addClass('current').siblings('.current').removeClass('current');
                this._filterUpdate();
            },
            //选择送餐费
            _filteHandler: function (e, el) {
                $(el).addClass('current').siblings('.current').removeClass('current');
                this._filterUpdate();
            },
            _touchstartHandler: function (e, el) {
                slide_config.wrap[0].style.webkitTransition = '0ms';
            },
            _touchmoveHandler: function (e, el) {
                e.preventDefault();
                slide_config.x = e.touches[0].pageX;

                if (slide_config.x < 40 || slide_config.x > slide_config.max) {
                    return
                }

                slide_config.wrap[0].style.webkitTransform = 'translateX(' + slide_config.x + 'px)';
            },
            _touchendHandler: function (e, el) {
                var _this = this;
                setTimeout(function () {
                    var endx = slide_config.x,
                        index = Math.ceil(endx / slide_config.unit);

                    _this._setFilterPointer(index - 1, slide_config.unit);
                    _this._filterUpdate();
                }, 0)
            },
            //外卖分类
            _takeoutShopCategoryList: function () {
                //筛选类目列表
                var _this = this,
                    taste = [
                        {"cateId": "101", "cateName": "中式炒菜"},
                        {"cateId": "199", "cateName": "快餐/小吃"},
                        {"cateId": "108", "cateName": "日韩料理"},
                        {"cateId": "104", "cateName": "蛋糕面包"},
                        {"cateId": "105", "cateName": "奶茶甜品"},
                        {"cateId": "113", "cateName": "烧烤/火锅"},
                        {"cateId": "109", "cateName": "水果蔬菜"}
                    ],
                    tid = _this.delivery_filter_data.taste_id;

                var arr = [];
                $.each(taste, function (k, v) {
                    arr.push('<li data-id="' + v.cateId + '" class="' + (tid == v.cateId ? 'current' : '') + '"><div><em></em><i class="kwbx_' + v.cateId + '"></i>' + v.cateName + '</div></li>');
                });
                $('#J_delivery_taste_list').html('<li class="' + (tid == '0' ? 'current' : '') + '" data-id="0"><div><em></em><i class="kwbx"></i>口味不限</div></li>' + arr.join(''));

                _this.wrap.find('#J_delivery_taste_list li').on(dd.event.click, function () {
                    //选择口味
                    $(this).addClass('current').siblings('.current').removeClass('current');
                    _this._filterUpdate();
                })
            },
            _buildEnterTmpl: function () {
                var _this = this;
                var tpl = dd.ui.tmpl(tpl_delivery_enter.html(), {'swipeid': History.getState().data.referer || 'index'});
                dd.ui.toast.hide();
                _this.wrap.html(tpl);

                this._enterHandler();
            },
            _enterHandler: function () {
                delivery_panel.find('#J_delivery_address').on(dd.event.click, function () {
                    var ddid = 'address'
                    var state_obj = {
                        'push': {
                            'ddid': ddid,
                            'obj': {
                                'referer': 'delivery'
                            }
                        }
                    };
                    bridge.push("login", function () {
                        dd.lib.ddState(state_obj);
                    });
                });
            },
            //渲染后业务
            _slideInit: function () {
                var _this = this;
                var width = document.body.clientWidth,
                    min = (width / 4) / 2;

                //人均筛选
                slide_config.wrap = $('#J_delivery_slide_pointer');
                slide_config.max = width - min;
                slide_config.unit = width / 4;

                _this._setFilterPointer(_this.delivery_filter_data.averageIndex, slide_config.unit);
            },
            _filterkHide: function () {
                var _this = this;

                _this.delivery_mask.hide();
                _this.delivery_filter_subclass.hide();
                _this.wrap.find('.J_subject_filter').filter('.current').removeClass('current');

                //_this.mainScroll.enable();
                //this._Scroll.touchEnable();
                this._scroll.enable();
            },
            _setFilterPointer: function (index, unit) {
                var to = index * unit + (unit / 2),
                    el = doc.getElementById('J_delivery_slide_pointer');

                el.style.webkitTransition = '100ms';
                el.style.webkitTransform = 'translateX(' + to + 'px)';

                $('#J_delivery_sort li').eq(index).addClass('current').siblings('.current').removeClass('current');

                setTimeout(function () {
                    $('#J_delivery_filter_subclass').hide();
                    $('#J_delivery_mask').hide();
                }, 100)

            },
            _filterUpdate: function () {
                var _this = this,
                    taste_li = $('#J_delivery_taste_list li.current'),
                    sort_li = $('#J_delivery_sort li.current'),
                    filte_li = $('#J_delivery_filte_list li.current');

                //更新筛选数据
                _this.delivery_filter_data.taste = taste_li.text() || '口味不限';
                _this.delivery_filter_data.taste_id = taste_li.attr('data-id') || '0';
                _this.delivery_filter_data.sort = sort_li.text() || '默认排序';
                _this.delivery_filter_data.sort_id = sort_li.attr('data-sort') || '0';
                _this.delivery_filter_data.filte = filte_li.text() || '口味不限';
                _this.delivery_filter_data.filte_v = filte_li.data('v') || '0';

                dd.lib.memCache.set('delivery_filter_data', _this.delivery_filter_data);
                _this._addressHandler();
                this._scroll.enable();
            },
            //滚动初始化
            _scrollInit: function () {
                var _this = this;
                this.winScroll = {}
                /*this.winScroll = dd.ui.winScroll({
                 'wrap': 'J_delivery',
                 'pullUpAction': function(){
                 _this._pullUpAction()
                 }
                 });*/
                this._scroll = dd.ui._scroll({
                    'wrap': '#J_delivery_scroll',
                    'pullUpAction': function () {
                        _this._pullUpAction()
                    }
                })
            },
            _pullDownAction: function () {
                //刷新
                var _this = this;

                _this.page.current = 1;
                _this._takeoutStoreList('refresh');
            },
            _pullUpAction: function () {
                //更多
                var _this = this;

                _this.page.current++;

                _this._takeoutStoreList('add');
            }
        }
    }

    dd.app.Delivery = function () {
        return new Delivery;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-外卖周边热门
 */
(function ($, window, dd) {
    var doc = window.document,
        bridge = window.bridge;

    var delivery_hot_wrap = $('#J_delivery_hot');

    var tpl_delivery_hot_ = $('#J_tpl_delivery_hot'),
        tpl_delivery_hot_list = $('#J_tpl_delivery_hot_list');

    var History = window.History;

    function DeliveryHot() {
        return {
            wrap: delivery_hot_wrap,
            init: function (arg1,arg2) {
                var _this = this;

                _this.longitude = arg1;
                _this.latitude = arg2;

                _this.page = {
                    'pz': 20, //每页条数
                    'pn': 1, //当前页
                    'total': 0, //订单总数
                    'pTotal': 1, //总页数
                    'role': 'init'
                };

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setBeforePageOut: function (i, o) {
            },
            setAfterPageOut: function (i, o) {
            },
            setBeforePageIn: function (i, o) {
            },
            setAfterPageIn: function (i, o) {
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;
                var options = {
                    'swipeid': History.getState().data.referer || 'delivery'
                };
                var tpl = dd.ui.tmpl(tpl_delivery_hot_.html(), options);
                _this.wrap.html(tpl);

                //loading
                _this.delivery_hot_content = _this.wrap.find('#J_delivery_hot_content').html(dd.ui.tpl.load);

                _this.pullup_el = _this.wrap.find('.J_pullUp');
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                //hack for 2 times load(setBeforePageIn && init)
                _this._getHotList();
            },
            _getHotList: function () {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.getHotTakeoutItems',
                    v: '1.0',
                    data: {
                        pos_y: _this.latitude,
                        pos_x: _this.longitude,
                        page_size: _this.page.pz,
                        page_no: _this.page.pn
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;

                    _this.page['total'] = _data.count;
                    _this.page['pTotal'] = Math.ceil(parseInt(_data.count) / _this.page.pz);

                    _this._buildTmpl(_data)
                }, function (data) {
                    if (_this.page.init !== 'init') {
                        _this.page.pn--;
                    }
                    dd.ui.toast(data, _this);
                });
            },
            _buildTmpl: function (data) {
                var _this = this;
                var options = {
                    list: data.itemList || []
                }

                //渲染
                var tpl = dd.ui.tmpl(tpl_delivery_hot_list.html(), options);
                
                //刷新前清空
                if (_this.page.role == 'init') {
                    _this.delivery_hot_content.html('');

                    //重置当前页码
                    _this.page.pn = 1;
                }
                
                _this.delivery_hot_content.append(tpl);

                if (_this.page.role == 'init') {
                    _this._scrollInit();
                }

                _this._manualHandler();
            },
            //业务后逻辑
            _manualHandler: function(){
                var _this = this,
                    page = _this.page;

                //判断是否有翻页
                if(page.pTotal > 1 && page.pn < page.pTotal) {
                    _this.pullup_el.removeClass('dn');
                }else{
                    _this.pullup_el.addClass('dn');
                }
                _this._scroll.refresh();
                
            },
            events: [
                [dd.event.click, '.J_delivery_item', '_itemHandler'],
                [dd.event.click, '#J_delivery_search', '_searchHandler']
            ],
            //滚动初始化
            _scrollInit: function () {
                var _this = this;

                this._scroll = dd.ui._scroll({
                    'wrap': '#J_delivery_hot_scroll',
                    'pullUpAction': function () {
                        _this._pullUpAction()
                    }
                })
            },
            _pullUpAction: function () {
                //更多
                var _this = this;

                _this.page.pn++;
                _this.page.role = 'add';

                _this._getHotList();
            }
        }
    }

    dd.app.DeliveryHot = function () {
        return new DeliveryHot;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-点菜列表
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var doc = window.document,
        body = doc.body;

    var dian_panel = $('#J_dian');

    //script模板
    var tpl_dian = $('#J_tpl_dian'),
        tpl_dian_li = $('#J_tpl_dian_li');

    var async = false; //异步标识

    dd.lib.memCache.set('dian_cache', {})

    //var dianCache = dd.lib.memCache.get('dian_cache');

    var History = window.History;

    function Dian() {
        return {
            wrap: dian_panel,

            reserve_init: false,

            reserve_filter_data: {},

            init: function (arg1) {
                var _this = this;

                _this.search_key = arg1;

                _this.outcity = false; //非当前定位城市
                _this.dian_filter_data = _this.dian_filter_data || _this._filterDataReset();

                if (_this.search_key) {
                    _this.dian_filter_data.kw = _this.search_key;
                }

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            _filterDataReset: function () {
                return {
                    'x': 0, //经度
                    'p': this._filterPReset(),
                    'y': 0, //纬度
                    'ibf': 0,
                    'd': 0, //距离(米), 0-全城
                    'city': '', //城市id
                    'kw': '',
                    'cat': 0, //口味, 0-不限
                    'pz': this._filterPzReset(), //单页条数
                    'f': this._filterF('all'), //32768-预定, 8192-优惠, 全部
                    'o': 'flags8192', //默认排序
                    'ptotal': this._filterPtotalReset() //页数
                }
            },
            _filterPzReset: function () {
                return 20;
            },
            _filterPReset: function () {
                return 1;
            },
            _filterPtotalReset: function () {
                return 0;
            },

            _filterF: function (type) {
                var _this = this;
                reserve_filter = $('#J_ReserveFilter');

                reserve_filter.hide();

                if (type == 'reserve') {
                    //初始化预定筛选条
                    if (!_this.reserve_init) {
                        _this.getReserveData(reserve_filter);
                    }

                    reserve_filter.show();

                    return '32768'
                } else if (type == 'quan') {
                    return '8192'
                } else {
                    return '128,2048,4096,8192,16384,32768'
                }
            },

            getReserveData: function (wrap) {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.reserveCondition',
                    v: '1.0',
                    data: {}
                }, function (data) {
                    var tpl = dd.ui.tmpl($('#J_tpl_dian_reserve').html(), data.data);
                    wrap.html(tpl);

                    $.each(wrap.find('select'), function (i, item) {
                        var name = $(item).attr('data-name');
                        _this.reserve_filter_data[name] = $(item).attr('data-init');
                    });

                    _this.reserve_init = true;
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },

            setBeforePageOut: function (i, o) {
                /*if(!/index/.test(i)) {
                 this.scroll_top = doc.body.scrollTop;
                 }
                 doc.body.scrollTop = 0;*/
            },
            setAfterPageOut: function (i, o) {
                var _this = this;
                if (i == 'index') {
                    _this.dian_filter_data = null;
                    /*_this.dian_filter_data.kw = '';
                     //_this.dian_filter_data.o = 'wfzb';
                     dd.lib.memCache.set('dian_filter_data', _this.dian_filter_data);*/
                }
                /*this.winScroll && this.winScroll.loadDisable();*/
            },
            setBeforePageIn: function (i, o) {

            },
            setAfterPageIn: function (i, o) {
                /*this.winScroll && this.winScroll.loadEnable();
                 this.winScroll && this.winScroll.refresh();

                 if(this.scroll_top) {
                 doc.body.scrollTop = this.scroll_top;
                 this.scroll_top = 0;
                 }*/

                var _this = this;
                //来自城市更新
                if (dd.lib.memCache.get('update_city')) {
                    //_this.dian_filter_data.city = dd.lib.localStorage.get('default_address').citycode;
                    //_this.dian_filter_data.o = 'wfzb';
                    _this._cityInit();
                }

                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: 'http://g.dd.alicdn.com/tps/i2/T12wwaFRXXXXa2FNje-36-35.png'
                }, function () {
                });
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;
                //loading
                _this.wrap.html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;

                //没有当前城市
                if (!dd.lib.localStorage.get('current_city')) {
                    body.addEventListener('click', dd.lib.preventAllClick, true);
                    dd.lib.getH5Geo({
                        'callback': function (g_pos, data) {
                            body.removeEventListener('click', dd.lib.preventAllClick, true);
                            _this._cityInit()
                        }
                    });
                    return
                }

                //hack for 2 times load(setBeforePageIn && init)
                if (!dd.lib.memCache.get('update_city')) {
                    _this._cityInit();
                }
            },
            _cityInit: function () {
                var _this = this;

                var geo_location = dd.lib.memCache.get('geo_location') || {};

                _this.current_city = dd.lib.localStorage.get('current_city') || geo_location; //城市信息


                //update city
                _this.dian_filter_data.city = _this.current_city.cityId;

                //对比定位城市
                if (_this.dian_filter_data.city !== geo_location.cityId) {
                    _this.outcity = true;
                    //非定位城市， 距离相关信息重置
                    _this.dian_filter_data.d = 0;
                    _this.dian_filter_data.x = 0;
                    _this.dian_filter_data.y = 0;
                } else {
                    _this.outcity = false;
                    _this.dian_filter_data.x = geo_location.longitude;
                    _this.dian_filter_data.y = geo_location.latitude;
                }

                _this._buildTmpl();
            },
            _titleLazy: true,
            _buildTmpl: function () {
                var _this = this;

                //_this.dian_filter_data = dd.lib.memCache.get('dian_filter_data');

                var options = {
                    'cityname': _this.current_city.cityName || '城市',
                    'kw': _this.dian_filter_data.kw,
                    //'o': _this.dian_filter_data.o,
                    'swipeid': History.getState().data.referer || 'index',
                    'filter': _this.dian_filter_data
                }
                //渲染
                var tpl = dd.ui.tmpl(tpl_dian.html(), options);
                _this.wrap.html(tpl);
                if (_this.wrap.find(".hd_title").find("h2") && !_this.wrap._titleLazy) {
                    bridge.push("setTitle", {
                        title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                    });
                }
                //console.log(_this.current_city.cityId)
                if (!_this.current_city.cityId) {
                    _this.wrap.find('#J_dian_list').html(dd.ui.tpl.load)
                    dd.ui.toast('无法定位，请检查“定位”设置<br>', _this);

                    setTimeout(function () {
                        dd.ui.toast('请选择城市');
                        dd.lib.ddState({
                            'push': {
                                'ddid': 'city',
                                'obj': {
                                    'referer': 'dian'
                                }
                            }
                        });
                    }, dd.ui.appinterval);
                    return
                }

                _this.dian_filter_cat = _this.wrap.find('#J_dian_filter_cat');
                _this.dian_filter_subclass = _this.wrap.find('#J_dian_filter_subclass');
                _this.subclass_content = _this.wrap.find('#J_subclass_content');
                _this.dian_mask = _this.wrap.find('#J_dian_mask');

                _this.pulldown_el = _this.wrap.find('.J_pulldown');
                _this.pullup_el = _this.wrap.find('.J_pullUp');

                _this._pageInit();
                _this._getStoreList('refresh');
                _this._getCategoryList()

            },
            _pageInit: function () {
                var _this = this;
                /*_this.page = {
                 p: 1, //当前页
                 ptotal: 0, //总页数
                 pz: 20 //每页条数
                 }*/
                _this.dian_filter_data.p = _this._filterPReset();
                _this.dian_filter_data.pz = _this._filterPzReset();
                _this.dian_filter_data.ptotal = _this._filterPtotalReset();

                dd.lib.memCache.set('dian_filter_data', _this.dian_filter_data);
                _this.wrap.find('#J_dian_list').html(dd.ui.tpl.load)

                _this.pulldown_el.addClass('dn');
                _this.pullup_el.addClass('dn');
            },
            _getStoreList: function (role) {
                //list
                var _this = this;

                if (_this.outcity && _this.dian_filter_data.d !== 0) {
                    _this._buildOutCity();
                    return
                }

                async = true;

                lib.mtop.request({
                    api: 'mtop.life.diandian.getStoreList',
                    v: '1.1',
                    data: {
                        'x': _this.dian_filter_data.x,
                        'y': _this.dian_filter_data.y,
                        'ibf': 0,
                        'f': _this.dian_filter_data.f,
                        'kw': _this.dian_filter_data.kw,
                        'cat': _this.dian_filter_data.cat,
                        'p': _this.dian_filter_data.p,
                        'pz': _this.dian_filter_data.pz,
                        'city': _this.dian_filter_data.city,
                        'o': _this.dian_filter_data.o,
                        'reserved': _this.dian_filter_data.reserve || ''
                    }
                }, function (data) {
                    if (data.data) {
                        _this._storeDataHandler(data.data, role);
                        //缓存
                        //dianCache[k] = data.data;
                    }
                    async = false;
                }, function (data) {
                    dd.ui.toast(data, _this);
                    async = false;
                    if (role !== 'refresh') {
                        _this.dian_filter_data.p--;
                    }
                });
            },
            _storeDataHandler: function (data, role) {
                var _this = this;
                _this.dian_filter_data.ptotal = Math.ceil(parseInt(data.count) / _this.dian_filter_data.pz);
                _this._buildList({'storeList': data.storeDList}, role);
            },
            //异地
            _buildOutCity: function () {
                var _this = this;
                _this.wrap.find('#J_dian_list').html('<div class="no_content"><i></i>异地或者没有位置信息</div>');
                //_this.pulldown_el.show();
                //_this.pullup_el.hide();

                _this._scrollInit()
            },
            //渲染列表
            _buildList: function (data, role) {
                var _this = this;
                _this._storeList = _this._storeList || [];
                if (data.storeList && data.storeList.length) {
                    _this._storeList = _this._storeList.concat(data.storeList);
                }

                var tpl = dd.ui.tmpl(tpl_dian_li.html(), data);

                if (role == 'refresh') {
                    _this.wrap.find('#J_dian_list').empty();
                }
                if (!_this._storeList.length || (data.storeList && data.storeList.length)) {
                    this.wrap.find('#J_dian_list').append(tpl);
                }

                /*_this.pulldown_el.show();
                 _this.pullup_el.show();*/

                if (role == 'refresh') {
                    //显示上拉加载
                    if (_this.dian_filter_data.ptotal > 1) {
                        _this.pullup_el.removeClass('dn');
                    } else {
                        _this.pullup_el.addClass('dn');
                    }

                    setTimeout(function () {
                        _this._scrollInit();
                    }, 0)
                } else {
                    if (_this.dian_filter_data.p >= _this.dian_filter_data.ptotal) {
                        _this.pullup_el.addClass('dn');
                    }

                    _this._scroll.refresh();
                }
            },
            //口味分类
            _getCategoryList: function () {
                //筛选类目列表
                var _this = this,
                    catid = _this.dian_filter_data.cat;

                lib.mtop.request({
                    api: 'mtop.life.diandian.categoryList',
                    v: '1.0',
                    data: {
                        'city': _this.dian_filter_data.city
                    }
                }, function (data) {
                    if (data.data) {
                        var arr = [];
                        $.each(data.data.cateList, function (k, v) {
                            arr.push('<li data-type="cat" data-v="' + v.cateId + '" class="' + (catid == v.cateId ? 'current' : '') + '"><i></i>' + v.cateName + '</li>');
                        });
                        $('#J_dian_cate_list').html('<li data-type="cat" class="' + (catid == '0' ? 'current' : '') + '" data-v="0"><i></i>口味不限</li>' + arr.join(''));
                    }
                }, function (data) {
                    //dd.ui.toast(data);
                });
            },
            /*startUp: function(tpl){
             this.wrap.find('#J_dian_list').append(tpl);
             },*/
            events: [
                [dd.event.click, '.J_dian_item', '_itemHandler'],
                [dd.event.click, '#J_dian_search', '_searchHandler'],
                [dd.event.click, '.J_dian_filter_tab', '_filterTabHandler'],
                [dd.event.click, '#J_dian_filter_cat', '_filterSubclassHandler'],
                [dd.event.click, '.J_subclass_tab', '_SubclassTabHandler'],
                [dd.event.click, '#J_subclass_content li', '_SubclassLiHandler'],
                [dd.event.click, '#J_dian_mask', '_maskHandler'],
                ['change', 'select', '_reserveHandler']
            ],

            _reserveHandler: function (e, el) {
                var _this = this,
                    $el = $(el),
                    name = $el.data('name'),
                    v = el.value;

                var show_value = $el.siblings('.J_show_value'),
                    option_el = $el.children().not(function () {
                        return !this.selected
                    }),
                    text = option_el.text();

                show_value.text(text);

                _this.reserve_filter_data[name] = v;

                var temp = _this.reserve_filter_data;

                //拼接各参数
                _this.dian_filter_data.reserve = temp.reserveDate + temp.reserveRang + temp.capacity;

                _this._filterUpdate();
            },

            //点击店铺
            _itemHandler: function (e, el) {
                dd.lib.ddState({
                    'push': {
                        'ddid': 'store/' + $(el).data('id'),
                        'obj': {
                            'referer': 'dian'
                        }
                    }
                });
            },
            //搜索触发
            _searchHandler: function () {
                var _this = this;
                var ddid = 'search/dian';
                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'referer': 'dian',
                            'dianData': _this.dian_filter_data
                        }
                    }
                };
                $('#J_search').removeAttr('data-ddid');
                dd.lib.ddState(state_obj);
            },
            //预定优惠筛选
            _filterTabHandler: function (e, el) {
                var _this = this,
                    $el = $(el);

                if (!dd.lib.localStorage.get('current_city')) {
                    return
                }

                if ($el.hasClass('current')) {
                    _this.dian_filter_data.f = _this._filterF('all');
                    $el.removeClass('current');
                } else {
                    _this.dian_filter_data.f = _this._filterF($el.data('type'));
                    $el.addClass('current').siblings('.J_dian_filter_tab').removeClass('current');
                }

                _this._filterUpdate();
            },
            //筛选
            _filterSubclassHandler: function (e, el) {
                var _this = this;
                if (async) {
                    return;
                }

                if ($(el).hasClass('current')) {
                    _this._filterSubclassHide();
                    return
                }

                _this.dian_mask.show();

                setTimeout(function () {
                    _this.dian_filter_subclass.show();
                }, 0)

                $(el).addClass('current')

                _this.scrolldisable = true;

                this._scroll.disable();
            },
            //筛选tab 口味-距离
            _SubclassTabHandler: function (e, el) {
                var _this = this;
                if (async) {
                    return;
                }

                if ($(el).hasClass('current')) {
                    return
                }

                var type = $(el).data('type');

                setTimeout(function () {
                    _this.subclass_content.attr('class', 'subclass_content subclass_' + type).show();
                }, 0)

                $(el).addClass('current').siblings('.current').removeClass('current');
            },
            //筛选单项
            _SubclassLiHandler: function (e, el) {
                var type = $(el).data('type'),
                    v = $(el).data('v');

                $(el).addClass('current').siblings().removeClass('current');

                this.dian_filter_data[type] = v;
                this._filterUpdate();

                //标识
                if (parseInt(v) == 0) {
                    this.dian_filter_cat.removeClass('selected')
                } else {
                    this.dian_filter_cat.addClass('selected')
                }
            },
            _filterUpdate: function (el) {
                var _this = this;
                /*var _this = this,
                 el_o = el.attr('data-o');
                 //更新筛选数据

                 _this.dian_filter_data.o = el_o;*/

                dd.lib.memCache.set('dian_filter_data', _this.dian_filter_data);

                //_this.mainScroll.scrollTo(0,0);
                _this._pageInit();
                //_this.mainScroll.destroy();
                _this._getStoreList('refresh');

                _this._filterSubclassHide();
            },
            _maskHandler: function (e, el) {
                this._filterSubclassHide();
            },
            _filterSubclassHide: function () {
                this.dian_filter_subclass.hide();
                this.dian_mask.hide();
                this.dian_filter_cat.removeClass('current');

                //this.mainScroll.enable();
                //this.scrolldisable = false;
                this._scroll.enable();
            },
            //滚动初始化
            _scrollInit: function () {
                var _this = this;

                this._scroll = dd.ui._scroll({
                    'wrap': '#J_dian_scroll',
                    'pullUpAction': function () {
                        _this._pullUpAction()
                    }
                })
            },
            menuEvent: '_searchHandler',

            _pullUpAction: function () {
                //更多
                var _this = this;

                _this.dian_filter_data.p++;

                _this._getStoreList('add');
            }
        }
    }

    dd.app.Dian = function () {
        return new Dian;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-券
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var evoucher_wrap = $('#J_evoucher');

    //script模板
    var tpl_evoucher = $('#J_tpl_evoucher'),
        tpl_evoucher_content = $('#J_tpl_evoucher_content'), //店铺券
        tpl_evoucher_shpp_content = $('#J_tpl_evoucher_shpp_content'); //外卖券

    var evoucher_content,
        evoucher_buy_btn,
        evoucher_largess_btn,
        evoucher_cache = {},
        evoucher_usr_cache = {};

    function Evoucher() {
        return {
            wrap: evoucher_wrap,
            init: function (arg1, arg2) {
                var _this = this;

                _this.id = arg1;

                _this.type = /^shop_/.test(arg2) ? 'shop' : 'store'

                _this.localStoreId = _this.type == 'store' ? arg2 : arg2.replace(/^shop_/, '');
                if(_this.localStoreId == "undefined" || _this.localStoreId == "null"){
                    _this.localStoreId = '';
                }
                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            //静态
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'alt': History.getState().data.referer || 'dian',
                    'type': _this.type
                };
                var tpl = dd.ui.tmpl(tpl_evoucher.html(), options);
                evoucher_wrap.html(tpl);

                //loading
                evoucher_content = evoucher_wrap.find('#J_evoucher_content').html(dd.ui.tpl.load);
                evoucher_buy_btn = evoucher_wrap.find('#J_evoucher_buy_btn');
                evoucher_largess_btn = evoucher_wrap.find('#J_evoucher_largess_btn');
            },
            //动态
            _renderDynamic: function () {
                var _this = this;

                _this.geo_location = dd.lib.memCache.get('geo_location') || {};

                if (_this.geo_location && _this.geo_location.latitude && _this.geo_location.longitude) {
                    _this.showDistance = true;
                }
                if (_this.type == 'store') {
                    _this._getEvoucher(_this.geo_location);
                } else {
                    _this._getShopEvoucher(_this.geo_location);
                }
            },

            _getEvoucher: function (loc) {
                var _this = this;

                if (_this.async) {
                    return
                }
                _this.async = true;

                lib.mtop.request({
                    api: 'mtop.dd.ticket.sellerevoucher.detail',
                    v: '1.0',
                    data: {
                        'id': _this.id,
                        'latitude': loc && loc.latitude,
                        'longitude': loc && loc.longitude
                    }
                }, function (data) {
                    if (data.data) {
                        _this.async = false;
                        _this._buildTmpl(data.data);
                        if (dd._hideTitleBar) {
                            bridge.push("setTitle", {
                                title: "代金券详情"
                            });
                        }
                        evoucher_cache[_this.id] = data.data;
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                    _this.async = false
                });
            },
            _buildTmpl: function (data) {
                var _this = this;

                if (data) {
                    _this.endTime = data.offtimeDate;
                    _this.now = data.systemNowTime;
                    var st = new Date(_this.now.replace(/-/g, "/")),
                        ed = new Date(_this.endTime.replace(/-/g, "/"));

                    _this.validBeginDate = +ed;
                    _this.nowTime = +st;
                    _this.publishTime = +new Date(data.ontimeDate.replace(/-/g, "/"));
                    _this.publishendTime = +new Date(data.offtimeDate.replace(/-/g, "/"));
                    _this.showbeginTime = data.showbeginDate && +new Date(data.showbeginDate.replace(/-/g, "/"));
                    _this.isSales = data.isSales;
                    _this.useRuleDo = data.useRuleDo;
                    _this.stock = data.stock;
                    var duration = ed - st;
                    var days = duration / 86400000 >= 1 ? parseInt(duration / 86400000) : 0;
                    duration = duration - days * 86400000;
                    var hours = duration / 3600000 >= 1 ? parseInt(duration / 3600000) : 0;
                    duration = duration - hours * 3600000;
                    var minutes = duration / 60000 >= 1 ? parseInt(duration / 60000) : 0;
                    var endStr = (days ? days + "天" : "0天") + (hours ? hours + "小时" : "0小时") + (minutes ? minutes + "分钟" : "0分钟");
                    endStr && (data.endTimes = endStr + "后结束");
                    data.refundAnytimeIcon = data.refundAnytime == "1" ? "y" : 'n';
                    data.refundOverdueIcon = data.refundOverdue == "1" ? "y" : 'n';
                    data.showDistance = _this.showDistance;

                    if (_this.showDistance && data.branchOffice && data.branchOffice.length) {
                        var dis = dd.lib.geoDistance({
                            latitude: _this.geo_location.latitude,
                            longitude: _this.geo_location.longitude
                        },{
                            latitude: data.branchOffice[0].latitude,
                            longitude: data.branchOffice[0].longitude
                        });
                        dis = (dis / 1000).toFixed(1) + " 千米";
                        data.nearDis = dis;
                    }
                }
                var tpl = dd.ui.tmpl(tpl_evoucher_content.html(), {'data': data});

                evoucher_content.html(tpl);

                _this.isSales = data.isSales;
                _this.conferType = data.conferType;
                _this._t = _this.conferType == "fullSent";

                if (parseInt(_this.useRuleDo.buyLimit) > 0) {
                    _this._manualHandler();
                } else {
                    _this._getUsrVouchers();
                }

                _this._scrollInit();
            },
            _getUsrVouchers: function () {
                var _this = this, btnText = '';
                if (_this.conferType == "buyOnline") {
                    if (_this.showbeginTime < _this.publishTime && _this.publishTime > _this.nowTime) {
                        btnText = '<span class="btn_sub_primary" id="J_evoucher_buy_btn">立即抢购</span>';
                    } else if (_this.publishendTime < _this.nowTime) {
                        btnText = '<span class="btn_sub_primary evoucher_outTime">已下架</span>';
                    } else {
                        if (parseInt(_this.stock) <= 0) {
                            btnText = '<span class="btn_sub_primary evoucher_outTime">已被抢光</span>';
                        } else if (_this.userVouchers && parseInt(_this.userVouchers.result) >= _this.useRuleDo.buyLimit) {
                            btnText = '<span class="btn_sub_primary evoucher_outTime">已购买</span>';
                        } else {
                            btnText = '<span class="btn_sub_primary" id="J_evoucher_buy_btn">立即抢购</span>';
                        }
                    }
                } else if (_this.conferType == "fullSent") {
                    if (_this.showbeginTime < _this.publishTime && _this.publishTime > _this.nowTime) {
                        btnText = '<span class="btn_sub_primary" id="J_evoucher_largess_btn">立即领取</span>';
                    } else if (_this.publishendTime < _this.nowTime) {
                        btnText = '<span class="btn_sub_primary evoucher_outTime">已下架</span>';
                    } else if (parseInt(_this.stock) <= 0) {
                        btnText = '<span class="btn_sub_primary evoucher_outTime">已被抢光</span>';
                    } else if (_this.userVouchers && parseInt(_this.userVouchers.result) >= _this.useRuleDo.buyLimit) {
                        btnText = '<span class="btn_sub_primary evoucher_outTime">已领取</span>';
                    } else {
                        btnText = '<span class="btn_sub_primary" id="J_evoucher_largess_btn">立即领取</span>';
                    }
                }
                var title = _this.wrap.find(".name");
                btnText && $(btnText).insertBefore(title);
            },

            _getShopEvoucher: function (loc) {
                var _this = this;

                if (_this.async) {
                    return
                }
                _this.async = true;

                lib.mtop.request({
                    api: 'mtop.dd.voucher.localstore.detail',
                    v: '1.0',
                    data: {
                        'voucherId': _this.id,
                        'latitude': loc.latitude || 0,
                        'longitude': loc.longitude || 0
                    }
                }, function (data) {
                    if (data.data) {
                        _this._buildShopCouponTmpl(data.data);
                    }
                    _this.async = false
                }, function (data) {
                    dd.ui.toast(data, _this);
                    _this.async = false
                });
            },
            _buildShopCouponTmpl: function (data) {
                var tpl = dd.ui.tmpl(tpl_evoucher_shpp_content.html(), {'data': data});
                this._t = data.itemSalesType == "free";
                evoucher_content.html(tpl);

                this._scrollInit();
            },
            events: [
                [dd.event.click, '#J_evoucher_buy_btn', '_btnHandler'],
                [dd.event.click, '#J_evoucher_largess_btn', '_largessBtnHandler'],
                [dd.event.click, '.evoucher_address', '_pushMap'],
                [dd.event.click, '#J_shop_voucher_buy_btn', '_shopVoucherBuyHandler'],
                [dd.event.click, '.J_shoplist', '_pushShoplist']
            ],

            _pushShoplist:function(){
                var _this = this;
                dd.lib.ddState({
                    'push': {
                        'ddid': 'my_evoucher_shoplist',
                        'obj': {
                            list: evoucher_cache[_this.id].branchOffice
                        }
                    }
                });
            },


            _pushMap: function (e, tar) {
                var _this = this,
                    d = $(tar).data("referer");

                if (d) {
                    var v = 'address_map/show';
                    d = d.split(";");
                    $('#J_address_map').removeAttr('data-ddid');

                    var state_obj = {
                        'push': {
                            'ddid': v,
                            'obj': {
                                'data': {
                                    posx: d[1],
                                    posy: d[0]
                                },
                                'referer': 'store/' + _this.storeid
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            },
            //购买
            _btnHandler: function () {
                var ddid = 'evoucher_buy/' + this.id + (this.localStoreId ? '/' + this.localStoreId : '');
                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'data': evoucher_cache[this.id],
                            'referer': 'evoucher/' + this.id
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },
            //领取
            _largessBtnHandler: function () {
                var _this = this;

                if (_this.async) {
                    return
                }
                _this.async = true;

                dd.ui.toast.loading();

                lib.mtop.request({
                    api: 'mtop.dd.ticket.evoucher.largess',
                    v: '1.0',
                    data: {
                        'id': _this.id
                    }
                }, function (data) {
                    if (data.data) {
                        var state_obj = {
                            'push': {
                                'ddid': 'pay_result/' + data.data.result,
                                'obj': {
                                    'data': evoucher_cache[_this.id]
                                }
                            }
                        };
                        $('#J_evoucher_result').removeAttr('data-ddid');
                        dd.lib.ddState(state_obj);
                    }
                    dd.ui.toast.hide();
                    _this.async = false
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false
                });
            },
            //外卖券购买领取
            _shopVoucherBuyHandler: function () {
                var _this = this;

                if (_this.async) {
                    return
                }
                _this.async = true;

                dd.ui.toast.loading();
                lib.mtop.request({
                    api: 'mtop.dd.voucher.user.buy',
                    v: '1.0',
                    data: {
                        'voucherId': _this.id,
                        'num': 1,
                        'localstoreId': _this.localStoreId
                    }
                }, function (data) {
                    var ddid = 'pay_result/' + data.data.taobaoOrderNo;
                    var state_obj = {
                        'push': {
                            'ddid': ddid,
                            'obj': {
                                type: _this._t,
                                voucherId: _this.id,
                                isEvoucher: true
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                    dd.ui.toast.hide();
                    _this.async = false
                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false
                });
            },
            _manualHandler: function () {
                var _this = this;
                if (_this.async) {
                    return
                }
                _this.async = true;

                lib.mtop.request({
                    api: 'mtop.dd.ticket.evoucher.userevouchers',
                    v: '1.0',
                    data: {
                        'id': _this.id
                    }
                }, function (data) {
                    if (data.data) {
                        _this.userVouchers = data.data;
                        _this._getUsrVouchers();
                        evoucher_usr_cache[_this.id] = data.data;
                    }
                    _this.async = false
                }, function (data) {
                    dd.ui.toast(data, _this);
                    _this.async = false
                });
            },
            // for url &close=1
            _scrollInit: function () {}
        }
    }

    dd.app.Evoucher = function () {
        return new Evoucher;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-现金券购买
 */
(function ($, window, dd) {
    var evoucher_buy_wrap = $('#J_evoucher_buy'),
        tpl_evoucher_buy = $('#J_tpl_evoucher_buy'),
        tpl_evoucher_buy_content = $('#J_tpl_evoucher_buy_content');

    var evoucher_buy_content,
        evoucher_input_tel,
        evoucher_input_count,
        evoucher_pay;

    var bridge = window.bridge,
        History = window.History;

    function EvoucherBuy() {
        return {
            wrap: evoucher_buy_wrap,
            init: function (arg1, arg2) {
                var _this = this;

                _this.id = arg1;
                _this.localStoreId = arg2;
                _this.initHandler();

            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'alt': History.getState().data.referer || 'evoucher/' + _this.id
                };
                var tpl = dd.ui.tmpl(tpl_evoucher_buy.html(), options);
                evoucher_buy_wrap.html(tpl);

                //loading
                evoucher_buy_content = evoucher_buy_wrap.find('#J_evoucher_buy_content').html(dd.ui.tpl.load);
                evoucher_pay = evoucher_buy_wrap.find('#J_evoucher_pay');
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                _this.data = History.getState().data.data;

                if (!_this.data) {
                    dd.lib.ddState({
                        'back': {
                            'ddid': 'evoucher/' + _this.id
                        }
                    });
                    return;
                }

                _this.data.userTel = dd.lib.memCache.get('dian_tel') || '';

                _this._buildTmpl();
            },
            _buildTmpl: function () {
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_evoucher_buy_content.html(), {'data': _this.data});
                _this.startUp(tpl);

                evoucher_input_tel = evoucher_buy_wrap.find('#J_evoucher_input_tel');
                evoucher_input_count = evoucher_buy_wrap.find('.J_evoucher_buy_count');

                //_this.bindHandler();
                _this._iScrollInit();
            },
            startUp: function (tpl) {
                evoucher_buy_content.html(tpl);
            },
            events: [
                [dd.event.click, '#J_evoucher_pay', '_payHandler'],
                [dd.event.click, '.J_evoucher_buy_options', '_optionsHandler']
            ],
            _payHandler: function () {
                var telv = $.trim(evoucher_input_tel.val()),
                    countv = $.trim(evoucher_input_count.text());

                //付款
                if (this._validPhone(telv) && this._validCount(countv) ) {
                    this._createOrder();
                }
            },
            _optionsHandler: function(e, el) {
                var _this = this;
                if (_this.async) {
                    return;
                }
                _this.async = true;
                _this._evoucherOptions($(el));
            },
            //优惠劵多张购买
            _evoucherOptions: function (el) {
                var _this = this,_data = _this.data;
                var role = el.data('role'),
                    limit = !_data.useRuleDo.buyLimit||_data.useRuleDo.buyLimit=='0'?Math.min(_data.buyOnceMaxNum,_data.stock):Math.min(_data.buyOnceMaxNum,_data.stock,_data.useRuleDo.buyLimit),
                    cc = parseInt(evoucher_input_count.eq(0).text());

                if (role == 'plus') {
                    cc++;
                    if (cc > limit) {
                        _this.async = false;
                        return;
                    }
                    
                    el.siblings('.J_evoucher_buy_options').addClass('active');
                    if (cc == limit) {
                        el.removeClass('active');
                    }
                        
                    _this._updateOptions(cc);
                } else {
                    cc--;
                    if (cc <= 0) {
                        el.removeClass('active');
                        _this.async = false;
                        return;
                    }
                    
                    el.siblings('.J_evoucher_buy_options').addClass('active');
                    _this._updateOptions(cc);
                }
                
                _this.async = false;
            },
            _updateOptions: function(cc) {
                var _this = this;
                var evoucher_payValue = $('.J_evoucher_buy_payValue'),
                    payValue = (parseInt(_this.data.preferentialValue)*cc/100);
                    
                    evoucher_input_count.text(cc);
                    evoucher_payValue.text(payValue.toFixed(2));
            },
            _validCount: function (v) {
                if (!parseInt(v)) {
                    dd.ui.toast('购买份数异常');
                    return;
                }
                dd.lib.memCache.set('dian_evoucher_buy_count', v);
                return true;
            },
            //验证电话
            _validPhone: function (v) {
                if (!v) {
                    dd.ui.toast('请输入手机号');
                    return;
                }

                if (v > 13000000000 && v < 19000000000) {
                    dd.lib.memCache.set('dian_tel', v);
                    return true;
                } else {
                    dd.ui.toast('请输入正确的手机号码！');
                    return;
                }
            },
            _createOrder: function () {
                var _this = this;

                if (_this.async) {
                    return;
                }
                _this.async = true;
                !bridge.supportFunc("tradePay") && dd.ui.toast.loading();

                lib.mtop.request({api: 'mtop.dd.order.evoucher.buy',
                    v: '1.0',
                    data: {
                        'id': parseInt(_this.id),
                        'num': dd.lib.memCache.get('dian_evoucher_buy_count'),
                        'localstoreid': _this.localStoreId || "",
                        'mobile': dd.lib.memCache.get('dian_tel')
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    if (_data) {
                        _this._doPay(_data);
                    }

                }, function (data) {
                    dd.ui.toast(data);
                    _this.async = false
                });
            },
            _doPay: function (orderData) {
                var _this = this;

                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        "tradeNO": orderData.alipayTradeIds
                    }, function (result) {
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            _this._payCb(orderData);

                        }
                        _this.async = false;
                    })
                }
                else {
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': orderData.taobaoOrderIds,
                            'payType': 0
                        }
                    }, function (data) {
                        if (data.data.canPay == 'true') {
                            if (dd.device.isAndroid && dd.device.version.android < 4) {
                                location.href = data.data.alipayUrl;
                                return;
                            }
                            dd.ui.alipay({
                                'title': '支付',
                                'alipayUrl': data.data.alipayUrl,
                                'successFunc': function () {
                                    //所有页面重置标识
                                    _this._payCb(orderData);
                                }
                            });
                        }


                        dd.ui.toast.hide();
                        _this.async = false
                    }, function (data) {
                        dd.ui.toast(data);
                        _this.async = false
                    });
                }
            },
            _payCb: function (orderData) {
                $('#J_page').children().removeAttr('data-ddid');
                var state_obj = {
                    'push': {
                        'ddid': 'pay_result/'+orderData.orderNo,
                        obj: {
                            type: orderData.orderType,
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },
            //滚动初始化
            _iScrollInit: function () {
                /*var _this = this;
                 _this.mainScroll && _this.mainScroll.destroy();

                 _this.mainScroll = dd.ui.scroll({
                 'view': _this,
                 'wrap': '#J_evoucher_buy_scroll'
                 });*/

            }
        }
    }

    dd.app.EvoucherBuy = function () {
        return new EvoucherBuy;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-首页
 */
(function ($, window, dd) {
    var body = window.document.body;
    var index_panel = $('#J_index'),
        tpl_index = $('#J_tpl_index'),
        tpl_index_activity = $('#J_tpl_index_activity');

    var bridge = window.bridge;

    var initoff = false,
        bindlock = false;

    var bottom_panel = $('#J_bottom_panel');

    var History = window.History;

    var pageinit, acst, aced, ddst, dded;

    var current_city;

    function Index() {
        return {
            wrap: index_panel,
            init: function () {
                var _this = this;
                _this.index_search_data = _this.index_search_data || {
                    'kw': '',
                    'city_data': {}
                }
                var pid = +new Date() + "_index";//用于埋点，标识具体页面
                _this.pid = pid;
                _this._monitor();
                _this.ttid = dd.lib.getUriParam(History.getState().url, 'ttid');
                _this.city_data = {};
                _this.initHandler();
            },
            _monitor: function () {
                var _this = this,
                    w = window,
                    pid = _this.pid,
                    timimg,
                    startTime;
                if (w.performance && (timimg = w.performance.timing)) {
                    startTime = timimg.navigationStart;
                    startTime && dd.sendImage({st: startTime}, pid);
                }
            },
            _bannerList: {},
            _homeBannerList: {},
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setBeforePageIn: function () {
            },
            setBeforePageOut: function (i, o) {
            },
            setAfterPageIn: function () {
                this._cityReset();
            },
            setAfterPageOut: function () {
                this.carouseScroll && this.carouseScroll.stop();
                this.carousel_lock = true;
            },
            //渲染
            _renderStatic: function () {
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_index.html(), {'width': $('#J_page').width()});
                _this.wrap.html(tpl);
                _this.home_activity_wrap = _this.wrap.find('#J_home_activity_wrap');
                _this.home_menu_wrap = _this.wrap.find('#J_home_menu_wrap');

                $('#J_index_city').text(_this.city_data.cityName || '城市').parent().addClass('J_swipe_page');
                if (!dd._env) {
                    bridge.push("login", function (result) {
                        if (result && (result.success || result.loginResult)) {
                            _this._userGet();
                        }
                    });
                }
            },
            //动态渲染 TODO: _cityReset整合
            _renderDynamic: function () {
                var _this = this;
                /*if(!dd.lib.memCache.get('city_list')) {
                 dd.lib.getH5Geo();
                 }*/
                //更新titleBar内容
            },
            menuEvent: '_cityClick',
            events: [
                [dd.event.click, '#J_close_webview', '_closeWebviewHandler'],
                [dd.event.click, '.home_menu_vouchers', '_goTicket'],
                [dd.event.click, '.J_index_menu', '_menuHandler'],
                [dd.event.click, '#J_index_carousel_wrap li', '_carouselLiHandler'],
                [dd.event.click, '#J_index_search', '_searchHandler'],
                [dd.event.click, '.J_home_box_item', '_boxItemHandler']
            ],
            //
            _goTicket: function () {
                var _this = this,
                    current_city = dd.lib.localStorage.get("current_city"),
                    url = 'http://h5.m.taobao.com/dd/card/index.html';

                _this.ttid && (url += "?ttid=" + _this.ttid);
                var geoInfo = [];
                if (current_city['cityId']) {
                    geoInfo.push('ci=' + current_city['cityId']);
                }
                if (current_city['longitude']) {
                    geoInfo.push('lo=' + current_city['longitude']);
                }
                if (current_city['latitude']) {
                    geoInfo.push('la=' + current_city['latitude']);
                }
                if (current_city['cityName']) {
                    geoInfo.push('ca=' + encodeURIComponent(current_city['cityName']));
                }
                if (geoInfo.length) {
                    url += url.indexOf("?") != -1 ? "&" + geoInfo.join("&") : "?" + geoInfo.join("&");
                }
                _this._pushWindow({url: url, showToolBar: false, showTitleBar: true});
            },
            //城市信息组装
            _getCityInfo: function(){
                var _this = this,
                    current_city = dd.lib.localStorage.get("current_city");

                if(!current_city) {
                    return
                }

                var city_info = [];
                if (current_city['cityId']) {
                    city_info.push('ci=' + current_city['cityId']);
                }
                if (current_city['longitude']) {
                    city_info.push('lo=' + current_city['longitude']);
                }
                if (current_city['latitude']) {
                    city_info.push('la=' + current_city['latitude']);
                }
                if (current_city['cityName']) {
                    city_info.push('ca=' + encodeURIComponent(current_city['cityName']));
                }

                return city_info.join('&');
            },
            _closeWebviewHandler: function () {
                bridge.push("closeWebview");
            },
            //点击区块
            _menuHandler: function (e, el) {
                var ddid = $(el).attr('data-swipeid');
                var state_obj = {
                    'push': {
                        'ddid': ddid
                    }
                };
                //重置模块 是否所有模块都重置？
                $('#J_' + ddid).removeAttr('data-ddid');
                dd.lib.ddState(state_obj);
            },
            //点击banner
            _carouselLiHandler: function (e, el) {
                var _this = this,
                    $el = $(el),
                    item,
                    ttid = _this.ttid,
                    list = _this._bannerList,
                    id = $el.attr('data-id');

                if (!id || !(item = list[id])) {
                    return
                }

                var actionlink = item.actionLink;
                if (/^http:\/\//.test(actionlink)) {
                    if(_this._getCityInfo()) {
                        actionlink += (actionlink.indexOf('?')>-1 ? '&':'?') + _this._getCityInfo();
                    }
                    _this._pushWindow({url: actionlink, showToolBar: true});
                } else {
                    var ddid = dd.lib.translateNativeSchema2Ddid(actionlink);
                    var state_obj = {
                        'push': {
                            'ddid': ddid,
                            'obj': {
                                'referer': 'index'
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            },
            _pushWindow: function (param) {
                bridge.push("pushWindow", param);
            },
            //搜索
            _searchHandler: function (e, el) {
                var _this = this;

                if (!_this.city_data.cityId) {
                    dd.ui.toast('请先选择城市');
                    return
                }
                var ddid = 'search/index';
                var state_obj = {
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'referer': 'index'
                        }
                    }
                };
                //初始化kw
                dd.lib.ddState(state_obj);
            },
            _boxItemHandler: function (e, el) {
                var _this = this,
                    id = $(el).attr('data-id'),
                    item,
                    list = _this._homeBannerList;

                if (!id || !(item = list[id])) {
                    return
                }
                var uri = $.trim(item.url);

                if (uri) {
                    if (/^http:\/\//.test(uri)) {
                        if(_this._getCityInfo()) {
                            uri += (uri.indexOf('?')>-1 ? '&':'?') + _this._getCityInfo();
                        }
                        _this._pushWindow({url: uri, showToolBar: true});
                    } else {
                        var ddid = dd.lib.translateNativeSchema2Ddid(uri);
                        dd.lib.ddState({
                            'push': {
                                'ddid': ddid,
                                'obj': {
                                    'referer': 'index'
                                }
                            }
                        });
                    }
                }
            },
            //用户信息
            _userGet: function () {
                lib.mtop.request({
                    api: 'mtop.dd.user.get',
                    v: '1.0',
                    data: {},
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    if (parseInt(_data.dd) || parseInt(_data.waimai) || parseInt(_data.unuseCount) || parseInt(_data.unpayCount) || parseInt(_data.unprizeCount)) {
                        $('#J_undo_point').show();
                    }
                }, function (data) {
                    dd.ui.toast(data);
                });
            },
            _cityClick: function () {
                var tar = $('#J_index_city').parent();
                dd.lib.ddState({
                    'push': {
                        'ddid': tar.data("swipeid"),
                        'obj': {
                            'referer': tar.data('referer')
                        }
                    }
                })
            },
            //重置当前城市
            _cityReset: function () {
                var _this = this;
                //没有定位过
                pageinit = +new Date();
                if (!(current_city = dd.lib.localStorage.get("current_city"))) {
                    _this.home_activity_wrap.html(dd.ui.tpl.geo);
                    body.addEventListener('click', dd.lib.preventAllClick, true);
                    dd.lib.getH5Geo({
                        'callback': function (pos) {
                            body.removeEventListener('click', dd.lib.preventAllClick, true);
                            if (pos.latitude) {
                                _this._cityReset();
                            } else {
                                _this.pid && dd.sendImage({city: +new Date()}, _this.pid);
                                dd.lib.ddState({
                                    'push': {
                                        'ddid': 'city'
                                    }
                                });
                            }
                        }
                    });
                    return
                }


                var last_cityid = _this.city_data.cityId || '';
                _this.city_data = current_city || (dd.lib.memCache.get('geo_location') || {});

                //搜搜数据同步
                _this.index_search_data.city_data = _this.city_data;
                dd.lib.memCache.set('index_search_data', _this.index_search_data);
                $('#J_index_city').text(_this.city_data.cityName || '城市').parent().addClass('J_swipe_page');

                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    title: _this.city_data.cityName || '城市'
                }, function () {
                });

                if (dd._hideTitleBar) {
                    bridge.push("setTitle", {
                        title: "淘点点"
                    });
                }
                if (!_this.city_data.cityId) {
                    //build空
                    _this._buildActs({});
                    return
                }

                //对比是否切换过城市
                if (last_cityid !== _this.city_data.cityId) {
                    _this._getActsInfo();
                    _this._getDDResource();
                } else {
                    this.carouseScroll && this._carouselInit();
                }

            },
            //获取活动信息
            _getActsInfo: function () {
                var _this = this;
                var geo_location = dd.lib.memCache.get('geo_location'), cb;
                acst = +new Date();
//                console.log((acst - pageinit) + "ms开始获取banner");
                cb = function () {
                    lib.mtop.request({
                        api: 'mtop.life.diandian.getActsInfo',
                        v: '2.0',
                        data: {"useCity": _this.city_data.cityId || 0, "gpsCity": geo_location ? geo_location.cityId : 0, "bannerType": dd.mtop_banner_request.type, "clientVersion": dd.mtop_banner_request.version},
                        extParam: {}
                    }, function (data) {
                        var _data = data.data;
                        for (var i in _data.model) {
                            _this._bannerList[_data.model[i].id] = _data.model[i];
                        }
                        _this._buildActs(_data);
                        aced = +new Date();
//                    console.log((aced - acst) + "ms渲染完成banner");
//                    console.log((aced - pageinit) + "ms banner完成");
                    }, function (data) {
                        dd.ui.toast(data);
                    });
                }
                if (dd.mtop_banner_request) {
                    cb.call(_this);
                } else {
                    $(document).on("cfgReady", function () {
                        cb.call(_this);
                    })
                }
            },
            //card信息
            _getDDResource: function () {
                var _this = this;
                _this.home_activity_wrap.html(dd.ui.tpl.load);
                ddst = +new Date();
//                console.log((ddst - pageinit) + "ms开始获取card");
                lib.mtop.request({
                    api: 'mtop.life.diandian.getDDResource',
                    v: '1.0',
                    data: {
                        'city': _this.city_data.cityId,
                        'bundles': 'home_menuItem_2.9.2,home_banner_2.9.3'
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    _this._buildResource(_data);
                    dded = +new Date();
//                    console.log((dded - ddst) + "ms渲染card完成");
//                    console.log((dded - pageinit) + "ms card完成");
                    dd.lib.memCache.set('city_list', data.data.cityList);
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            _buildActs: function (data) {
                var _this = this;
                data.width = $('#J_page').width();
                var tpl = dd.ui.tmpl($('#J_tpl_index_banner').html(), {'data': data});
                _this.wrap.find('#J_home_banner').html(tpl);
                _this.pid && dd.sendImage({act: +new Date()}, _this.pid);

                var carousel_wrap = $('#J_index_carousel_wrap');

                //滚动配置
                _this.indicator = $('#J_index_indicator');
                _this.carousel_options = {
                    'wrap': carousel_wrap, //容器
                    'max': carousel_wrap.find('li').length, //最大条数
                    'interval': 5000 //间隔
                }

                //滚动
                if (data.model && data.model.length > 1) {
                    _this._carouselInit();

                    _this.carousel_timer = undefined;
                    //_this._carouselLoop();
                }

            },
            _buildResource: function (data) {
                var _this = this;
                var city_home = data['city_' + _this.city_data.cityId];

                var home_banner = city_home ? city_home['home_banner_2.9.3'] : [],
                    home_menuItem = city_home ? city_home['home_menuItem_2.9.2'] : [];

                for (var i in home_banner) {
                    home_banner[i].id = 'card' + i;
                    var url = home_banner[i].pic;
                    url += url.indexOf(".jpg") != -1 ? "_q30.jpg" : "";
                    home_banner[i].pic = url.replace(/gtms0(1|2|3|4).alicdn.com/, "g.dd.alicdn.com");
                    _this._homeBannerList[home_banner[i].id] = home_banner[i];
                }
                var tpl = home_banner.length ? dd.ui.tmpl(tpl_index_activity.html(), {'home_banner': home_banner}) : '<div class="empty_card"><img src="http://g.dd.alicdn.com/tps/i2/TB1lSa4FFXXXXX3aXXXXD.cNVXX-400-200.png" alt=""/></div>';
                _this.home_activity_wrap.html(tpl);
                _this.pid && dd.sendImage({card: +new Date()}, _this.pid);

                if (home_menuItem.length) {
                    var i = 0;
                    _this.home_menu_wrap.children().each(function () {
                        $(this).find('.J_menu_intro').text(home_menuItem[i].name);
                        i++;
                    })
                }

                _this._iScrollInit();
            },
            //banner滚动
            _carouselInit: function () {
                var _this = this;

                _this.carouseScroll && (_this.carouseScroll.kill() || (_this.carouseScroll = null));

                _this.carouseScroll = Swipe($('#J_index_carousel_wrap').children()[0], {
                    auto: 5000,
                    // continuous: true,
                    transitionEnd: function (index, element) {
                        _this._carouselImgLoad($(element));
                        _this._carouselIndicators(index);
                    }
                });

                _this._carouselIndicators(0);
            },
            //图片懒加载
            _carouselImgLoad: function (li) {
                if (!li.length) return
                var item = li.children();
                if (item.attr('data-original')) {
                    item.attr('style', 'background-image:url(' + item.attr('data-original') + ')');
                    item.removeAttr('data-original');
                }
            },
            //指示器
            _carouselIndicators: function (index) {
                var _this = this;
                var w = index * 9;

                _this.indicator.children()[0].style.webkitTransform = 'translate3d(' + w + 'px, 0, 0)';
            },
            //滚动初始化
            _iScrollInit: function () {
            }
        }
    }

    dd.app.Index = function () {
        return new Index;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: 点点H5-我的
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var my_panel = $('#J_my'),
        tpl_my = $('#J_tpl_my'),
        tpl_my_content = $('#J_tpl_my_content');

    var History = window.History;

    function My() {
        return {
            wrap: my_panel,
            init: function () {
                var _this = this;

                var state_url = History.getState().url;
                var logout_host = /m.taobao.com/.test(state_url) ? 'login.m.taobao.com' :
                    /wapptest.taobao.com/.test(state_url) ? 'login.wapptest.taobao.com' :
                        /wapa.taobao.com/.test(state_url) ? 'login.wapa.taobao.com' : '';

                //注销url
                _this.logout_url = 'http://' + logout_host + '/logout.htm?tpl_redirect_url=' + encodeURIComponent(state_url);

                _this.options = {
                    'dd': {},
                    'tc': {}
                };

                _this.initHandler();

            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function (args) {
                var _this = this;
                if (dd._hideTitleBar) {
                    try {
                        if (_this.wrap.find(".hd_title").find("h2") && !_this._titleLazy) {
                            bridge.push("setTitle", {
                                title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                            });
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            },
            //静态
            _renderStatic: function () {
                var _this = this;
                var tpl = dd.ui.tmpl(tpl_my.html(), {'swipeid': History.getState().data.referer || 'index'});
                _this.wrap.html(tpl);

                _this.wrap.find('#J_my_content').html(dd.ui.tpl.load);
            },
            //
            _renderDynamic: function () {
                var _this = this;

                _this._buildTmpl();
                // force to login
                bridge.push("login", function (result) {

                    //if (result && (result.success || result.loginResult)) {
                    _this._getMyInfo();
                    //}
                });
            },
            _getMyInfo: function () {
                var _this = this;

                //点点
                lib.mtop.request({
                    api: 'mtop.dd.user.get',
                    v: '1.1',
                    data: {},
                    extParam: {}
                }, function (data) {
                    var _data = data.data;

                    if (_data) {
                        //存储nick后续使用
                        //存储头像昵称，优化闪图现象
                        if (_data.pic) {
                            _data.pic.indexOf(".jpg") != -1 && (_data.pic += "_120x120.jpg")
                        }
                        dd.lib.localStorage.set('nick_name', _data.nick);
                        dd.lib.localStorage.set('nick_pic', _data.pic);

                        _this.options.dd = {
                            'dd': parseInt(_data.dd) || '', //点菜
                            'waimai': parseInt(_data.waimai) || '', //外卖
                            'unpayCount': parseInt(_data.unpayCount) || '', //未支付
                            'unuseCount': parseInt(_data.unuseCount) || '', //未使用券
                            'nick': _data.nick,
                            'reserveCount': parseInt(_data.reserveCount),
                            'pic': _data.pic,
                            'logout': _this.logout_url
                        }

                        _this._buildTmpl();
                    }
                }, function (data) {
                    dd.ui.toast(data, _this)
                });

            },
            _buildTmpl: function () {
                var _this = this;

                //_this.options.swipeid = History.getState().data.referer || '';
                //渲染组装
                _this.startUp();

                //_this.wrap.find('.J_pulldown').removeClass('dn')

                _this._iScrollInit();
            },
            events: [
                [dd.event.click, '.J_my_item', '_itemHandler'],
                [dd.event.click, '.J_my_login', '_loginHandler'],
                [dd.event.click, '.J_my_logout', '_loginOutHandler']
            ],
            startUp: function () {
                var _this = this,
                    nickName,
                    nickPic;
                var nickFromeCookie = lib.login.getNickFromCookie();

                /**
                 * 默认取本地存储的nick与头像
                 * 并且判断是否于本地cookie一致
                 * 防止切换用户导致头像错误
                 */
                nickName = dd.lib.localStorage.get('nick_name');
                nickPic = dd.lib.localStorage.get('nick_pic');

                if (nickName !== nickFromeCookie) {
                    nickPic = nickName = null;
                }

                _this.options.dd = _this.options.dd || {};
                _this.options.dd.nick = _this.options.dd.nick
                    || nickName
                    || "";
                _this.options.dd.pic = _this.options.dd.pic
                    || nickPic
                    || "http://g.dd.alicdn.com/tps/i1/T1x1VXFLBeXXaiKCsI-120-120.png";
                var tpl = dd.ui.tmpl(tpl_my_content.html(), _this.options);
                _this.wrap.find('#J_my_content').html(tpl);
            },
            _loginHandler: function (e) {
                var _this = this;
                bridge.push("login", function () {
                    $('#J_my').removeAttr('data-ddid');
                    _this._renderDynamic();
                });
            },
            _loginOutHandler: function (e) {
                var url = location.href;
                location.href = "http://login.m.taobao.com/logout.htm?tpl_redirect_url=" + encodeURIComponent(url);
            },
            _itemHandler: function (e, el) {
                var _this = this;

                var $el = $(el),
                    sid = $el.attr('data-swipeid');

                bridge.push("login", function (result) {
                    if (result && (result.success || result.loginResult)) {
                        $('#J_' + sid).removeAttr('data-ddid');
                        var state_obj = {
                            'push': {
                                'ddid': sid
                            }
                        };
                        dd.lib.ddState(state_obj);
                    } else {
                        _this._getMyInfo();
                        _this._myChildPush(sid);
                    }
                });
            },
            _myChildPush: function (ddid) {
                dd.lib.ddState({
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'referer': 'my'
                        }
                    }
                });
            },
            //滚动初始化
            _iScrollInit: function () {
                /*var _this = this;
                 _this.mainScroll && _this.mainScroll.destroy();

                 //_this.wrap.find('.J_pulldown').removeClass('dn');

                 _this.mainScroll = dd.ui.scroll({
                 'view': _this,
                 'wrap': '#J_my_scroll',
                 'pullDownAction': _this._pullDownAction
                 });*/
            },
            _pullDownAction: function () {
                this._renderDynamic();
            }
        }
    }

    dd.app.My = function () {
        return new My;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的订单详情
 */
(function($, window, dd){
    var bridge = window.bridge;
    var my_customer_service = $('#J_my_customer_service'),
        tpl_my_customer_service = $('#J_tpl_my_customer_service');

    var my_customer_service;

    var History = window.History;

    function MyCustomerService() {
        return {
            wrap: my_customer_service,

            init: function() {
                var _this = this;
                _this.pullup_el = undefined;
                _this.initHandler();
            },
            initHandler: function(){
                this._renderStatic();
            },
            //静态
            _renderStatic: function(){
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_my_customer_service.html(), {});
                my_customer_service.html(tpl);
            }
        }
    }
    dd.app.MyCustomerService = function() {
        return new MyCustomerService;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的外卖
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var my_delivery_panel = $('#J_my_delivery'),
        tpl_my_delivery = $('#J_tpl_my_delivery'),
        tpl_my_delivery_list = $('#J_tpl_my_delivery_list');

    var my_delivery_content;

    var History = window.History;

    function MyDelivery() {
        return {
            wrap: my_delivery_panel,
            init: function () {
                var _this = this;

                _this.pullup_el = undefined; //加载pull

                _this.deliveryList = _this.deliveryList || {};
                _this.page = {
                    'pz': 10, //每页条数
                    'p': 1, //当前页
                    'total': 0, //订单总数
                    'pTotal': 1 //总页数
                };

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'swipeid': History.getState().data.referer || 'my'
                };
                var tpl = dd.ui.tmpl(tpl_my_delivery.html(), options);
                my_delivery_panel.html(tpl);

                //loading
                my_delivery_content = my_delivery_panel.find('#J_my_delivery_content').html(dd.ui.tpl.load);

                //_this.pulldown_el = my_delivery_panel.find('.J_pulldown');
                _this.pullup_el = my_delivery_panel.find('.J_pullUp');
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                bridge.push("login", function () {
                    _this._getMyDelivery('refresh');
                });
            },

            _getMyDelivery: function (type) {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.getWaimaiOrderListForBuyer',
                    v: '1.0',
                    data: {
                        'pz': _this.page.pz,
                        'p': _this.page.p
                    },
                    extParam: {}
                }, function (data) {
                    var _data = data.data;
                    if (_data) {
                        _this.page['total'] = _data.total;
                        _this.page['pTotal'] = Math.ceil(parseInt(_data.total) / _this.page.pz);
                        var lists;
                        if (lists = _data.orders) {
                            for (var i = 0; i < lists.length; i++) {
                                _this.deliveryList[lists[i].orderId] = lists[i];
                                //判断是否存在剩余时间
                                if(lists[i].endSeconds !== '0'){
                                    _data.orders[i].endTime = _this._MillisecondToDate(parseFloat(lists[i].endSeconds)*1000);
                                }
                            }
                        }
                        _this._buildList(type, _data);

                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            //渲染列表
            _buildList: function (type, data) {
                var _this = this;
                var tpl = dd.ui.tmpl(tpl_my_delivery_list.html(), data);

                //刷新前清空
                if (type == 'refresh') {
                    my_delivery_content.html('');

                    //重置当前页码
                    _this.page.p = 1;
                }
                _this.startUp(tpl);

                if (type == 'refresh') {
                    //_this.pulldown_el.removeClass('dn');
                    _this._iScrollInit();
                }

                _this._manualHandler();
            },
            startUp: function (tpl) {
                my_delivery_content.append(tpl);
            },
            events: [
                [dd.event.click, '.J_order_item', '_itemHandler'],
                [dd.event.click, '.J_my_delivery_options', '_optionsHandler']
            ],
            _itemHandler: function (e, el) {
                if (/J_my_delivery_options/.test(e.target.className)) {
                    return
                }

                $('#J_my_delivery_details').removeAttr('data-ddid');
                var sid = $(el).data('swipeid');
                dd.lib.ddState({
                    'push': {
                        'ddid': sid,
                        'obj': {
                            'referer': 'my'
                        }
                    }
                })
            },
            _optionsHandler: function (e, el) {
                var _this = this;
                var role = $(el).data('role');
                switch(role){
                    case 'close':
                        //取消订单
                        _this._orderClose($(el));
                        break;
                    case 'refund':
                        //申请退款
                        _this._applyForRefund($(el));
                        break;
                    case 'review':
                        //评价
                        _this._applyForReview($(el));
                        break;
                    case 'receipt':
                        //确认收货
                        _this._orderPay($(el));
                        break;
                    case 'pay':
                        //付款
                        _this._orderPay($(el));
                        break;
                }
            },

            _applyForReview: function (el) {
                var sid = el.data('swipeid');
                dd.lib.ddState({
                    'push': {
                        'ddid': sid,
                        'obj': {
                            'referer': 'my_delivery'
                        }
                    }
                })
            },

            _applyForRefund: function (el) {
                $('#J_my_delivery_details').removeAttr('data-ddid');
                var sid = el.data('swipeid');
                dd.lib.ddState({
                    'push': {
                        'ddid': sid,
                        'obj': {
                            'referer': 'my_delivery'
                        }
                    }
                })
            },
            //切换后逻辑
            _manualHandler: function () {
                var _this = this,
                    page = _this.page,
                    type = page.type;

                //判断是否有翻页
                if (page['pTotal'] > 1 && page['p'] < page['pTotal']) {
                    _this.pullup_el.removeClass('dn');
                } else {
                    _this.pullup_el.addClass('dn');
                }
                _this.mainScroll.refresh();

            },
            _orderClose: function (el) {
                var _this = this;
                if (this.async) {
                    return
                }
                this.async = true;

                bridge.push('confirm', {
                    title: '',
                    message: '确定要取消该订单吗？',
                    okButton: '确定',
                    cancelButton: '取消'
                }, function (result) {
                    if (result.ok) {
                        dd.ui.toast.loading();
                        lib.mtop.request({
                            api: 'mtop.life.diandian.closeOrder',
                            v: '1.0',
                            data: {
                                'orderId': el.data('id'),
                                'isSeller': 0,
                                'reason': '淘点点-取消订单'
                            }
                        }, function (data) {
                            if (data.data) {
                                el.parent('.operat').html('交易关闭');
                            }
                            dd.ui.toast.hide();
                            _this.async = false;
                        }, function (data) {
                            dd.ui.toast(data);
                            _this.async = false;
                        });
                    } else {
                        _this.async = false;
                    }
                });
            },

            _orderPay: function (el) {
                var _this = this,
                    _list = _this.deliveryList,
                    id = el.data("id"),
                    currentItem = _list && _list[id];
                if (this.async) {
                    return
                }
                this.async = true;

                !bridge.supportFunc("tradePay") && dd.ui.toast.loading();

                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        "tradeNO": el.attr('data-alipay')
                    }, function (result) {
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            _this.initHandler();
                        }
                        _this.async = false;
                    })
                }
                else {
                    if (bridge.supportFunc("tradePay")) {
                        bridge.push("tradePay", {
                            "tradeNO": el.attr('data-alipay')
                        }, function (result) {
                            if (result.resultCode && parseInt(result.resultCode) == 9000) {
                                _this.initHandler();
                            }
                            _this.async = false;
                        })
                    } else {
                        lib.mtop.request({
                            api: 'mtop.order.doPay',
                            v: '1.0',
                            data: {
                                'orderId': el.data('id'),
                                'payType': currentItem && currentItem.status == "12" ? 1 : 0
                            }
                        }, function (data) {
                            if (data.data) {
                                if (data.data.canPay == 'true') {
                                    if (dd.device.isAndroid && dd.device.version.android < 4) {
                                        location.href = data.data.alipayUrl;
                                        return
                                    }
                                    dd.ui.alipay({
                                        'title': currentItem && currentItem.status == "12" ? "确认收货" : "支付",
                                        'optionMenu': currentItem && currentItem.status == "12" ? "已确认" : "支付完成",
                                        'alipayUrl': data.data.alipayUrl,
                                        'successFunc': function () {
                                            _this.initHandler()
                                        }
                                    });
                                }
                            }
                            dd.ui.toast.hide();
                            _this.async = false;
                        }, function (data) {
                            dd.ui.toast(data);
                            _this.async = false;
                        });
                    }
                }
            },
            _MillisecondToDate: function(msd) {
                var time = parseFloat(msd) /1000;
                if (time) {
                    if (time > 60 && time < 60*60) {
                        time = parseInt(time / 60.0) +"分钟";
                    }else if (time >= 60*60 && time < 60*60*24) {
                        time = parseInt(time / 3600.0) +"小时" + parseInt((parseFloat(time / 3600.0) - parseInt(time /3600.0)) *60) +"分钟"
                    }
                }
                return time || 0;

            },
            //滚动初始化
            _iScrollInit: function () {
                var _this = this;
//                _this.mainScroll && _this.mainScroll.destroy();

                _this.mainScroll = dd.ui._scroll({
                    'wrap': '#J_my_delivery_scroll',
                    'pullUpAction': function () {
                        //页码+1
                        _this.page['p']++;

                        _this._getMyDelivery('add');
                    }
                });
            }
        }
    }

    dd.app.MyDelivery = function () {
        return new MyDelivery;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的外卖订单详情
 */
(function ($, window, dd) {
    var my_delivery_details_panel = $('#J_my_delivery_details'),
        tpl_my_delivery_details = $('#J_tpl_my_delivery_details');

    var History = window.History,
        bridge = window.bridge;

    function MyDeliveryDetails() {
        return {
            details_data: {},
            wrap: my_delivery_details_panel,
            init: function (arg1) {
                var _this = this;

                _this.id = arg1;
                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },

            setAfterPageIn: function () {
                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: dd.config.option_menu_icon.share
                });
            },

            //静态模板
            _renderStatic: function () {
                //loading
                my_delivery_details_panel.html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.getTcOrderDetail',
                    v: '1.0',
                    data: {
                        'oid': _this.id
                    }
                }, function (data) {
                    if (data.data) {
                        _this.payType = data.data.status && data.data.status == "12" ? 1 : 0;
                        _this.details_data['d_' + _this.id] = data.data;
                        _this._buildTmpl(data.data);
                        if (dd._hideTitleBar) {
                            bridge.push("setTitle", {
                                title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                            });
                        }
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },

            _buildTmpl: function (data) {
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_my_delivery_details.html(), {'data': data, 'swipeid': History.getState().data.referer || 'my_delivery'});
                my_delivery_details_panel.html(tpl);

                _this.orderId = data.orderId;

            },

            menuEvent: '_shareMenu',

            events: [
                [dd.event.click, '#J_my_delivery_details_pay', '_payHandler'],
                [dd.event.click, '#J_my_delivery_details_confirm', '_payHandler'],
                [dd.event.click, '#J_my_delivery_details_cancel', '_cancelHandler'],
                [dd.event.click, '.J_Share', '_shareMenu'],
                [dd.event.click, '.J_devlivery_order_review', '_orderReview']
            ],

            _orderReview: function(e, el){
                var orderid = $(el).data('orderid');
                dd.lib.ddState({
                    'push': {
                        'ddid': 'review/' + orderid,
                        'obj': {
                            'referer': 'my_delivery'
                        }
                    }
                })
            },

            //修改
            /*_modifyHandler: function(e, el){
                dd.common.myOrder.modify({
                    'orderId': $(el).data('orderid'),
                    'type': $(el).data('type')
                })
            },*/


            _payHandler: function () {
                var _this = this,
                    data = _this.details_data['d_' + _this.id];

                //type = el.id == 'J_my_delivery_details_pay' ? 'pay' : 'confirm';

                this._doPay(data);
            },

            _cancelHandler: function () {
                var _this = this;

                bridge.push('confirm', {
                    title: '',
                    message: '确定要取消该订单吗？',
                    okButton: '确定',
                    cancelButton: '取消'
                }, function (result) {
                    if (result.ok) {
                        lib.mtop.request({
                            api: 'mtop.life.diandian.closeOrder',
                            v: '1.0',
                            data: {
                                'orderId': parseInt(_this.orderId),
                                'isSeller': 0,
                                'reason': '淘点点-取消订单'
                            }
                        }, function (data) {
                            _this.initHandler();
                        }, function (data) {
                            dd.ui.toast(data, _this);
                        });

                        _this.willUpdateMyDeliveryList();
                    }
                });
            },

            _doPay: function (data) {
                var _this = this;

                if (_this.async) {
                    return
                }
                _this.async = true;

                !bridge.supportFunc("tradePay") && dd.ui.toast.loading();

                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        "tradeNO": data.alipay
                    }, function (result) {
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            _this.initHandler();

                            _this.willUpdateMyDeliveryList();
                        }
                        _this.async = false;
                    })
                } else {
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': _this.id,
                            'payType': _this.payType
                        }
                    }, function (data) {
                        if (data.data.canPay == 'true') {
                            if (dd.device.isAndroid && dd.device.version.android < 4) {
                                location.href = data.data.alipayUrl;
                                _this.willUpdateMyDeliveryList();
                                return
                            }
                            dd.ui.alipay({
                                'title': _this.payType ? "确认收货" : "支付",
                                'optionMenu': _this.payType ? "已确认" : "支付完成",
                                'alipayUrl': data.data.alipayUrl,
                                'successFunc': function () {
                                    delete _this.details_data['d_' + _this.id];
                                    _this.initHandler()
                                }
                            });
                        }
                        dd.ui.toast.hide();
                        _this.async = false;

                        _this.willUpdateMyDeliveryList();
                    }, function () {
                        dd.ui.toast.hide();
                        _this.async = false;
                    });
                }
            },
            /*
             * 准备刷新我的外卖列表
             * 因为订单状态将发生变化
             */
            willUpdateMyDeliveryList: function () {
                $('#J_my_delivery').removeAttr('data-ddid');
            },

            _shareMenu: function(e, el){
                var _this = this;
                bridge.push("share", {
                    title: '淘点点外卖',
                    content: '淘点点的外卖，嗷嗷给力！',
                    image: 'http://gtms03.alicdn.com/tps/i3/T1PcyJFDpaXXbYfSkc-640-1738.png',
                    url: dd.config.share.jump + 'menu_takeoutid!/'+ _this.details_data['d_' + _this.id].shopId
                });
            }
        }
    }

    dd.app.MyDeliveryDetails = function () {
        return new MyDeliveryDetails;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的外卖退款申请
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var my_delivery_refund_panel = $('#J_my_delivery_refund'),
        tpl_my_delivery_refund = $('#J_tpl_my_delivery_refund');

    var History = window.History;

    function MyDeliveryRefund() {
        return {
            wrap: my_delivery_refund_panel,
            init: function (arg1) {
                var self = this;
                self.id = arg1;
                //loadding
                my_delivery_refund_panel.html(dd.ui.tpl.load);
                //mtop获取订单数据
                self._getOrderData();

                $(document).on('tplDomRenderEnd', function () {
                    //初始化select参数
                    self._selectInitParam();
                    //代理绑定select事件
                    self._selectBindEvent();

                    if (dd._hideTitleBar) {
                        bridge.push("setTitle", {
                            title: self.wrap.find(".hd_title").find("h2").html() || "淘点点"
                        });
                    }
                })
            },
            events: [
                [dd.event.click, '#J_all_select', '_checkboxHandler'],
                [dd.event.click, '.J_checkbox_option', '_checkboxOptionHandler'],
                [dd.event.click, '.J_footer_selector', '_selectOpen'],
                [dd.event.click, '#J_my_delivery_refund_submit', '_submitRefundHandler'],
                [dd.event.click, '#J_my_delivery_refundes', '_inputFocusHandler']

            ],
            setAfterPageOut: function () {
                $(document).unbind('createSelect');
                $(document).unbind('tplDomRenderEnd');
                $('#J_my_delivery_refund').removeAttr('data-ddid');
            },
            //input在容器里无法获取焦点定位
            _inputFocusHandler: function (e, el){
                //$(el).focus();
            },
            _checkData: function (){
                var self = this;
                if (!self.totle) {
                    dd.ui.toast('请选择要退款的菜品');
                    return false;
                } else if (!self.popBarSelector.data('value')) {
                    dd.ui.toast('请选择退款原因');
                    return false;
                } else {
                    return true;
                }
            },
            //提交退款申请
            _submitRefundHandler: function () {
                var self = this;
                //验证用户是否正确选择
                if (!self._checkData()) return;

                lib.mtop.request({
                    api: 'mtop.life.diandian.refundOrder',
                    v: '1.0',
                    data: {
                        'ids': self.ids,
                        'reasonId': self.popBarSelector.data('value'),
                        'self.popBarSelector': $('#J_my_delivery_refundes').text()
                    }
                }, function (data) {
                    if (data.data) {
                        dd.ui.toast('申请退款已提交成功');
                        self.willUpdateMyDeliveryList();
                        
                        dd.lib.ddState({
                            'replace': {
                                'ddid': 'my_delivery_details/' + self.id
                            }
                        });
                    }
                }, function (data) {
                    dd.ui.toast(data, self);
                });
            },
            _getOrderData: function () {
                var self = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.getTcOrderDetail',
                    v: '1.0',
                    data: {
                        'oid': self.id,
                        'refund': 1
                    }
                }, function (data) {
                    if (data.data) {
                        self._buildTmpl(data.data);
                        $(document).trigger('tplDomRenderEnd');
                    }
                }, function (data) {
                    dd.ui.toast(data, self);
                });
            },
            _buildTmpl: function (data) {
                var self = this;

                var tpl = dd.ui.tmpl(tpl_my_delivery_refund.html(), {'data': data, 'swipeid': History.getState().data.referer || 'my_delivery'});
                my_delivery_refund_panel.html(tpl);

                self.orderId = data.orderId;

                //_this._iScrollInit();
            },
            //全选功能
            _checkboxHandler: function (e, el) {
                var isSelected = $(el).find('.checkbox_default').hasClass('selected');
                var checkboxItems = $('#J_my_delivery_refund .checkbox_default').not('.disabled');
                if (!isSelected) {
                    checkboxItems.addClass('selected');
                } else {
                    checkboxItems.removeClass('selected');
                }
                this._calculateSeletedResult();
            },
            //判断是否全选中
            _isAllSeleted: function () {
                var checkboxItems = $('#J_my_delivery_refund .J_checkbox_option .checkbox_default')
                    .not('.disabled')
                    .not('.visibility');
                var allSelectedNode = $('#J_all_select .checkbox_default');
                var isAll = true;
                $.each(checkboxItems, function (index, item) {
                    if (!$(item).hasClass('selected')) {
                        isAll = false;
                    }
                })
                if (isAll) {
                    allSelectedNode.addClass('selected');
                } else {
                    allSelectedNode.removeClass('selected');
                }
            },
            //模拟checkbox
            _checkboxOptionHandler: function (e, el) {
                var targetNode = $(el).find('.checkbox_default').not('.disabled');
                var isSelected = targetNode.hasClass('selected');

                if (!isSelected) {
                    targetNode.addClass('selected');
                } else {
                    targetNode.removeClass('selected');
                }
                this._calculateSeletedResult();
                this._isAllSeleted();
            },
            //计算选择的总价及个数
            _calculateSeletedResult: function () {
                var self = this;
                var checkboxItems = $('#J_my_delivery_refund .checkbox_default.selected');
                var selectedTotle = 0, selectedOrderIds = '';
                var totalBarNode = $('#J_footer_total_bar');
                $.each(checkboxItems, function (index, item) {
                    if (!$(item).data('item-total')) return;
                    selectedTotle += $(item).data('item-total');
                    selectedOrderIds += $(item).data('item-id') + ',';
                });

                //写入计算结果(选中的总结及份数)
                $('#J_refund_total')
                    .html(selectedTotle.toFixed(2));

                if (!selectedTotle) {
                    totalBarNode.addClass('hide');
                } else {
                    totalBarNode.removeClass('hide');
                }

                self.totle = selectedTotle.toFixed(2);
                self.ids = selectedOrderIds;

            },
            _selectInitParam: function () {
                var self = this;
                var hasMaskNode = $('.J_footer_select_mask');
                self.popBarNode = $('#J_footer_select_bar');
                self.markupNode = hasMaskNode[0] ? hasMaskNode : $('<div class="footer_select_mask J_footer_select_mask hide"></div>');
                self.popBarNodeHeight = this.popBarNode.height() + $('.J_footer_select_close').height() / 2;
                //触发select组件目标容器
                self.popBarSelector = $('.J_footer_selected_option');
                self.radiOptionNode = $('.J_select_radio_option');
                self.selectCloseNode = $('.J_footer_select_close');

                if (!hasMaskNode[0]) {
                    $(document.body)
                        .append(self.markupNode)
                        .append(self.popBarNode);
                }
            },
            _selectDestroy: function () {
                this.markupNode.unbind('click');
                this.radiOptionNode.unbind('click');
                this.selectCloseNode.unbind('click');
            },
            _selectClose: function (markup, popBar) {
                var self = this;
                self.markupNode.on('webkitTransitionEnd', function () {
                    self.popBarNode.css('visibility', 'hidden');
                    self.markupNode
                        .addClass('hide')
                        .unbind('webkitTransitionEnd');
                })
                window.setTimeout(function () {
                    self.markupNode
                        .removeClass('opacity');
                    self.popBarNode.css({
                        '-webkit-transition-duration': '.3s',
                        '-webkit-transform': 'translate3d(0,0,0)'
                    });
                }, 0);

                self._selectDestroy();
            },
            //选择退款原因
            _selectOpen: function () {
                var self = this;
                var bodyHeight = $(document.body).height() + $(document.body).scrollTop();
                dd.ui.toast.hide();

                self.popBarNode
                    .css('bottom', '-' + self.popBarNodeHeight + 'px');

                self.popBarNode.css('visibility', 'visible');

                self.markupNode
                    .height(bodyHeight)
                    .removeClass('hide');

                //markupNode渐变动画
                window.setTimeout(function () {
                    self.markupNode
                        .addClass('opacity');
                    self.popBarNode.css({
                        '-webkit-transition-duration': '.3s',
                        '-webkit-transform': 'translate3d(0, -' + self.popBarNodeHeight + 'px, 0)'
                    });
                }, 0);
                //radio选择事件
                self.radiOptionNode.on('click', function (e) {
                    self._selectRadioOption(e);
                })
                //弹层关闭事件
                self.selectCloseNode.on('click', function () {
                    self._selectClose();
                })
                self.markupNode.on('click', function () {
                    self._selectClose();
                })
            },
            //radio选择后触发事件
            _selectRadioOption: function (e) {
                var self = this;
                var targetNode = $(e.currentTarget).find('.radio_default');
                var isSelected = targetNode.hasClass('selected');
                if (!isSelected) {
                    targetNode.parents('.footer_select_content').find('.selected').removeClass('selected');
                    targetNode.addClass('selected');
                    self.popBarSelector
                        .text($(e.currentTarget).text())
                        .data('value', $(e.currentTarget).data('value'));
                } else {
                    targetNode.removeClass('selected');
                }
                self._selectClose();
            },
            /*
             * 准备刷新我的外卖列表
             * 因为订单状态将发生变化
             */
            willUpdateMyDeliveryList: function () {
                $('#J_my_delivery').removeAttr('data-ddid');
            },
            _selectBindEvent: function (e){

            }
        }
    }

    dd.app.MyDeliveryRefund = function () {
        return new MyDeliveryRefund;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的券包
 */
(function($, window, doc) {
	var bridge = window.bridge;
	var my_evoucher_panel = $('#J_my_evoucher'),
		tpl_my_evoucher = $('#J_tpl_my_evoucher'),
		tpl_my_evoucher_list = $('#J_tpl_my_evoucher_list'),
		tpl_my_card_list = $('#J_tpl_my_card_list'),
		tpl_my_hb_list = $('#J_tpl_my_hb_list');

	var my_evoucher_t1_list; //未使用

	var my_evoucher_list;

	function MyEvoucher() {
		return {
			wrap: my_evoucher_panel,
			init: function() {
				var _this = this;

				_this.asnyc = false; //
				// _this.pulldown_el = undefined; //刷新pull
				_this.pullup_el = undefined; //加载pull

				_this.page = {
					'limit': '20', //每页条数
					'type': '1', //类型, 1未下单 2待评价 3历史订单
					'total_t1': 0, //未下单总数
					'total_t2': 0, //待评价总数
					'pages_t1': 0, //未下单总页数
					'pages_t2': 0, //待评价总页数
					'page_current_t1': 1, //未下单当前页
					'page_current_t2': 1, //待评价当前页
					quan: {
						limit: 20,
						type: 1,
						page_current: 1,
						total: 1, //总数
						pages: 0, //总页数
						role: 'init'
					},
					hb: {
						limit: 100,
						type: 2,
						page_current: 1,
						total: 1,
						pages: 0,
						role: 'init'
					},
					card: {
						limit: 20,
						type: 3,
						page_current: 1,
						total: 1,
						pages: 0,
						role: 'init'
					}
				}

				_this.type = 'quan';

				_this.initHandler();
			},
			initHandler: function() {
				this._renderStatic();
				this._renderDynamic();
			},
			//静态模板
			_renderStatic: function() {
				var _this = this;

				var options = {};
				var tpl = dd.ui.tmpl(tpl_my_evoucher.html(), options);
				my_evoucher_panel.html(tpl);

				my_evoucher_list = my_evoucher_panel.find('#J_my_evoucher_list');
				// my_evoucher_t1_list = $('#J_my_evoucher_t1_list');
				// my_evoucher_t2_list = $('#J_my_evoucher_t2_list');

				//loading
				my_evoucher_list.find('#J_my_elist_quan').html(dd.ui.tpl.load);

				// _this.pulldown_el = my_evoucher_panel.find('.J_pulldown'),
				_this.pullup_el = my_evoucher_panel.find('.J_pullUp');
			},
			//动态渲染
			_renderDynamic: function() {
				var _this = this;
				bridge.push("login", function() {
					//_this._getMyOrder('refresh');
					_this._pageDispatch();
				});
			},
			_pageDispatch: function() {
				var _this = this;

				if (_this.type == 'quan') {
					_this._getMyListEoucher();
				} else if (_this.type == 'card') {
					_this._getMyListCard();
				} else if (_this.type == 'hb') {
					_this._getMyListHb();
				}
			},
			events: [
				[dd.event.click, '.J_my_tab_ul li', '_liHandler'],
				[dd.event.click, '#J_hb_intro', '_pushHbIntro']
			],
			_liHandler: function(e, el) {
				var _this = this;
				var $el = $(el);
				if (_this.asnyc) {
					return
				}

				if ($el.hasClass('current')) {
					return;
				}

				$el.addClass('current').siblings('.current').removeClass('current');

				//更新page类型
				_this.type = $el.data('type');

				/*var i = $el.index()+1;
				_this.page.type = i.toString();*/

				var list_item = my_evoucher_list.find('#J_my_elist_' + _this.type);

				if (!list_item.html()) {
					list_item.html(dd.ui.tpl.load);
					list_item.show().siblings().hide();
					_this.pullup_el.addClass('dn')

					//初始化page状态
					_this.page[_this.type].role = 'init';

					_this._pageDispatch();
				} else {
					list_item.show().siblings().hide();
					_this._switchHandler();
				}
			},
			_pushHbIntro: function() {
				bridge.push("pushWindow", {
					url: 'http://market.m.taobao.com/market/diandian/app-hb-intro.php',
					showToolBar: true
				});
			},
			//获取优惠券列表
			_getMyListEoucher: function() {
				var _this = this;
				_this.asnyc = true;

				lib.mtop.request({
					api: 'mtop.dd.voucher.user.list',
					v: '1.0',
					data: {
						'type': _this.page.quan.type,
						'limit': _this.page.quan.limit,
						'offset': (parseInt(_this.page.quan.page_current) - 1) * parseInt(_this.page.quan.limit)
					},
					extParam: {}
				}, function(data) {
					var _data = data.data;
					if (_data) {
						_this.page.quan.total = _data.total;
						_this.page.quan.pages = Math.ceil(parseInt(_data.total) / _this.page.quan.limit);

						_this._buildTpl(_data)
					}
					_this.asnyc = false;
				}, function(data) {
					dd.ui.toast(data, _this);
					_this.asnyc = false;
					_this._pageMinus();
				});
			},
			// 获取会员卡列表
			_getMyListCard: function(){
				var _this = this;
				_this.asnyc = true;

				_this.geo_location = dd.lib.memCache.get('geo_location') || {};

				lib.mtop.request({
					api: 'mtop.life.diandian.getMyMemberCardList',
					v: '1.0',
					data: {
						pageSize: _this.page.card.limit,
						pageNo: _this.page.card.page_current,
						latitude: _this.geo_location.longitude || 0,
						longitude: _this.geo_location.latitude || 0
					},
					extParam: {}
				}, function(data) {
					var _data = data.data;
					_this.page.card.total = parseInt(_data.total);
					_this.page.card.pages = Math.ceil(_this.page.card.total / _this.page.card.limit);

					_this._buildTpl(_data)
					_this.asnyc = false;
				}, function(data) {
					dd.ui.toast(data, _this);
					_this.asnyc = false;
					_this._pageMinus();
				});
			},
			//获取红包列表
			_getMyListHb: function() {
				var _this = this;
				_this.asnyc = true;

				lib.mtop.request({
					api: 'mtop.dd.ticket.evoucher.list',
					v: '1.1',
					data: {
						'type': _this.page.hb.type,
						'limit': _this.page.hb.limit,
						'offset': (parseInt(_this.page.hb.page_current) - 1) * parseInt(_this.page.hb.limit),
						'status': '0'
					},
					extParam: {}
				}, function(data) {
					var _data = data.data;
					if (_data) {
						_this.page.hb.total = _data.total;
						_this.page.hb.pages = Math.ceil(parseInt(_data.total) / _this.page.hb.limit);

						_this._buildTpl(_data)
					}
					_this.asnyc = false;
				}, function(data) {
					dd.ui.toast(data, _this);
					_this.asnyc = false;
					_this._pageMinus();
				});
			},
			// 页码-1
			_pageMinus: function(){
				if (_this.page[_this.type].role !== 'init') {
					_this.page[_this.type]['page_current']--;
				}
			},
			_buildTpl: function(data) {
				var _this = this,
					role = _this.page[_this.type].role;
				if (role == 'init') {
					_this._iScrollInit();
				}

				var tpl_source = 
					_this.type == 'quan' ? tpl_my_evoucher_list.html() :
					_this.type == 'card' ? tpl_my_card_list.html():
					_this.type == 'hb' ? tpl_my_hb_list.html() :  tpl_my_evoucher_list.html();

				var tpl = dd.ui.tmpl(tpl_source, data);

				var list_item = my_evoucher_list.find('#J_my_elist_' + _this.type);

				//刷新前清空
				if (role == 'init') {
					list_item.html('');

					//重置当前页码
					_this.page[_this.type].page_current = 1;
				}

				list_item.append(tpl).show() //.siblings().hide();

				_this._switchHandler();
			},
			//切换后逻辑
			_switchHandler: function() {
				var _this = this,
					page = _this.page,
					type = _this.type;

				//判断是否有翻页
				if (page[type].pages > 1 && page[type].page_current < page[type].pages) {
					_this.pullup_el.removeClass('dn');
				} else {
					_this.pullup_el.addClass('dn');
				}
				_this._scroll.refresh();

			},
			//滚动初始化
			_iScrollInit: function() {
				var _this = this;

				this._scroll = dd.ui._scroll({
					'wrap': '#J_my_evoucher_scroll',
					'pullUpAction': function() {
						_this._pullUpAction()
					}
				})
			},
			_pullUpAction: function() {
				//加载
				var _this = this,
					page = _this.page,
					type = _this.type;

				//页码+1
				page[type].page_current++;
				page[type].role = 'add';
				_this._pageDispatch();

				//_this._getMyOrder('add');
			}
		}
	}

	dd.app.MyEvoucher = function() {
		return new MyEvoucher;
	};
})(Zepto, window, document);
/**
 * @Descript: H5页面-我的现金券详情
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var my_evoucher_details = $('#J_my_evoucher_details'),
        tpl_my_evoucher_details = $('#J_tpl_my_evoucher_details');

    var shop_dialog = {};

    function MyEvoucherDetails() {
        return {
            wrap: my_evoucher_details,
            init: function (arg1) {
                var _this = this;
                _this.id = arg1;
                _this.data = undefined;
                _this.initHandler();
            },

            initHandler: function () {
                my_evoucher_details.html(dd.ui.tpl.load);
                this._renderDynamic();
            },

            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                _this.geo_location = dd.lib.memCache.get('geo_location') || {};
                _this.startUp(_this.geo_location);
            },
            startUp: function (loc) {
                var _this = this;

                if (loc && loc.latitude && loc.longitude) {
                    _this.showDistance = true;
                }
                lib.mtop.request({
                    api: 'mtop.dd.voucher.user.detail',
                    v: '1.0',
                    data: {
                        'voucherId': _this.id,
                        'latitude': loc && loc.latitude,
                        'longitude': loc && loc.longitude
                    }
                }, function (data) {
                    if (data.data) {
                        _this.data = data.data;
                        _this.data.showDistance = _this.showDistance;
                        if (_this.showDistance && _this.data.localstores && _this.data.localstores.length) {
                            var dis = dd.lib.geoDistance({
                                latitude: loc.latitude,
                                longitude: loc.longitude
                            },{
                                latitude: _this.data.localstores[0].latitude,
                                longitude: _this.data.localstores[0].longitude
                            });
                            dis = (dis / 1000).toFixed(1) + " 千米";
                            _this.data.nearDis = dis;
                        }
                        var tpl = dd.ui.tmpl(tpl_my_evoucher_details.html(), {
                            'data': _this.data
                        });

                        my_evoucher_details.html(tpl);

                        bridge.push("setTitle", {
                            title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                        });
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            _geo: function () {
                var _this = this;
                dd.lib.getH5Geo({
                    'callback': function (g_pos, data) {

                        //城市列表请求失败
                        if (!dd.lib.memCache.get('city_list')) {
                            dd.ui.toast(data, _this);
                            return
                        }

                        //成功渲染
                        _this.startUp(g_pos);
                    }
                });
            },
            events: [
                [dd.event.click, '.J_evoucher_use', '_evoucherUseHandler'],
                [dd.event.click, '.J_pop_store_item', '_popStoreItemUseHandler'],
                [dd.event.click, '.J_evoucher_refund', '_applyRefund'],
                [dd.event.click, '.evoucher_address', '_pushMap'],
                [dd.event.click, '.J_shoplist', '_pushShoplist']
            ],


            _pushMap: function (e, tar) {
                var _this = this,
                    d = $(tar).data("referer");

                if (d) {
                    var v = 'address_map/show';
                    d = d.split(";");
                    $('#J_address_map').removeAttr('data-ddid');

                    var state_obj = {
                        'push': {
                            'ddid': v,
                            'obj': {
                                'data': {
                                    posx: d[1],
                                    posy: d[0]
                                },
                                'referer': 'store/' + _this.storeid
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            },

            _pushShoplist: function () {
                var _this = this;
                dd.lib.ddState({
                    'push': {
                        'ddid': 'my_evoucher_shoplist',
                        'obj': {
                            list: _this.data.localstores,

                            referer: 'my_evoucher_details/' + _this.data.instanceId
                        }
                    }
                });
            },

            //使用券
            _evoucherUseHandler: function () {
                var _this = this,
                    localstores = _this.data.localstores;

                if (localstores.length > 1) {
                    //多店铺
                    var content_arr = [];

                    var d_arr = [], //距离数组
                        li_obj = {}; //模板对象

                    $.each(localstores, function (k, v) {
                        var d = dd.lib.geoDistance(_this.geo_location, {
                            'longitude': v.longitude,
                            'latitude': v.latitude
                        });

                        d_arr.push(d || k);

                        var dtext;

                        //距离文案
                        if (d > 1000) {
                            dtext = d / 1000 > 100 ? '>100千米' : dd.lib.num2Fixed(d / 1000, 1) + '千米'
                        } else if (d == 0) {
                            dtext = '';
                        } else {
                            dtext = parseInt(d) + '米';
                        }

                        li_obj[d || k] = '<li class="J_pop_store_item" data-storeid="' + v.localstoreId + '">' +
                            '<div class="shop_name">' + v.localstoreName +'<span>' + dtext + '</span></div>' +
                            '<div class="shop_address">' + v.address + '</div></li>';
                    });

                    //距离排序
                    d_arr.sort(function(a, b){
                        return a - b;
                    });


                    //根据排序组装模板顺序
                    $.each(d_arr, function (k, v) {
                        content_arr.push(li_obj[v]);
                    });

                    shop_dialog = dd.ui.dialog({
                        'cls': 'evoucherpop',
                        'title': '确定您所在的门店',
                        'wrap': '#J_my_evoucher_details',
                        'content': '<ul class="pop_shop_list">' + content_arr.join('') + '</ul>',
                        'maxheight': '300'
                    });
                } else {
                    //单店铺
                    if (_this.data.itemType == 'entity') {
                        //实物券
                        _this._pushConvert(localstores[0].localstoreId);
                    } else if (_this.data.itemType == 'takeout') {
                        // 外卖券
                        _this._pushTakeout(_this.data.localstoreId);
                    } else {
                        _this._pushPay(localstores[0].localstoreId);
                    }
                }
            },

            _popStoreItemUseHandler: function (e, el) {
                var _this = this;
                if (_this.data.itemType == 'entity') {
                    //兑换券
                    _this._pushConvert($(el).data('storeid'));
                } else if (_this.data.itemType == 'takeout') {
                    //外卖券
                    _this._pushTakeout($(el).data('storeid'));
                } else {
                    shop_dialog.hide();
                    shop_dialog = {};
                    this._pushPay($(el).data('storeid'));
                }
            },

            _applyRefund: function () {
                var _this = this;

                bridge.push('confirm', {
                    title: '提示？',
                    message: '退款申请一旦提交，该券将不能恢复！',
                    okButton: '确认退款',
                    cancelButton: '取消'
                }, function (result) {
                    if (result.ok) {
                        lib.mtop.request({
                            api: 'mtop.dd.ticket.evoucher.refund',
                            v: '1.0',
                            data: {
                                'id': _this.id
                            }
                        }, function (data) {
                            if (data.data.result == 'true') {
                                bridge.push('alert', {
                                    title: '提示',
                                    message: '退款申请已提交',
                                    buttons: ['确定']
                                });
                                _this.initHandler();
                                $('#J_my_evoucher').removeAttr('data-ddid');
                            }
                        }, function (data) {
                            dd.ui.toast(data, _this);
                        });
                    }
                });
            },

            //付款
            _pushPay: function (storeid) {
                var _this = this;
                bridge.push('confirm', {
                    title: '确定使用本券？',
                    message: '请确保您已在店内！',
                    okButton: '使用',
                    cancelButton: '不使用'
                }, function (result) {
                    if (result.ok) {
                        dd.lib.ddState({
                            'push': {
                                'ddid': 'pay_detail/' + storeid,
                                'obj': {
                                    'referer': 'my_evoucher_details/' + _this.id
                                }
                            }
                        })
                    }
                });
            },
            //兑换券使用
            _pushConvert: function (storeid) {
                var _this = this;

                bridge.push('confirm', {
                    title: '确定使用本券？',
                    message: '请确保您已在店内！',
                    okButton: '使用',
                    cancelButton: '不使用'
                }, function (result) {
                    if (result.ok) {
                        dd.ui.toast.loading();
                        lib.mtop.request({
                            api: 'mtop.dd.ticket.evoucher.convert',
                            v: '1.0',
                            data: {
                                'id': _this.id,
                                'localstoreid': storeid
                            }
                        }, function (data) {
                            if (data.data) {
                                if (data.data.result == 'true') {
                                    alert('兑换券使用成功，请和服务员确认！');
                                    _this.initHandler();
                                }
                                dd.ui.toast.hide();
                            }

                        }, function (data) {
                            dd.ui.toast(data, _this);
                        });
                    }
                });

            },
            //外卖券使用
            _pushTakeout: function (shopid) {
                var _this = this;
                dd.lib.ddState({
                    'push': {
                        'ddid': 'carte/delivery/' + shopid,
                        'obj': {
                            'referer': 'my_evoucher_details/' + _this.id
                        }
                    }
                })
            }
        }
    }

    dd.app.MyEvoucherDetails = function () {
        return new MyEvoucherDetails;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的现金券详情
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var my_evoucher_shoplist = $('#J_my_evoucher_shoplist'),
        tpl_my_evoucher_shoplist = $('#J_tpl_my_evoucher_shoplist');

    var History = window.History;

    function MyEvoucherShopList() {
        return {
            wrap: my_evoucher_shoplist,

            init: function () {
                var _this = this;

                _this.initHandler();
            },

            initHandler: function () {
                my_evoucher_shoplist.html(dd.ui.tpl.load);

                this._renderDynamic();
            },


            _renderDynamic: function () {
                var _this = this, hasLocated = false;

                _this.state = History.getState();

                var data = _this.state.data, list;

                _this.geo_location = dd.lib.memCache.get('geo_location') || {};

                if (_this.geo_location && _this.geo_location.latitude && _this.geo_location.longitude) {
                    hasLocated = true;
                }
                data.hasLocated = hasLocated;

                if(hasLocated && (list = data.list)){
                    for(var i = 0 ; i< list.length; i++){
                        var item = list[i];
                        if (item.longitude && item.latitude) {
                            var dis = dd.lib.geoDistance({
                                    latitude: item.latitude,
                                    longitude: item.longitude
                                },
                                {   latitude: _this.geo_location.latitude,
                                    longitude: _this.geo_location.longitude
                                });
                            dis = (dis / 1000).toFixed(1) + " 千米";
                            item.dis = dis;
                        }
                    }
                }
                var tpl = dd.ui.tmpl(tpl_my_evoucher_shoplist.html(), data);
                my_evoucher_shoplist.html(tpl);
            },

            events: [
                [dd.event.click, '.evoucher_address', '_pushMap']
            ],

            _pushMap: function (e, tar) {
                var _this = this,
                    d = $(tar).data("referer");

                if (d) {
                    var v = 'address_map/show';
                    d = d.split(";");
                    $('#J_address_map').removeAttr('data-ddid');

                    var state_obj = {
                        'push': {
                            'ddid': v,
                            'obj': {
                                'data': {
                                    posx: d[1],
                                    posy: d[0]
                                },
                                'referer': 'store/' + _this.storeid
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            }
        }
    }

    dd.app.MyEvoucherShopList = function () {
        return new MyEvoucherShopList;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: 点点H5-我的
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var my_panel = $('#J_my_feedback'),
        tpl_my_fd = $("#J_tpl_my_feedback");


    function
        MyFeedBack() {
        return {
            wrap: my_panel,
            init: function () {
                var _this = this;
                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function (args) {
                var _this = this;
                if (dd._hideTitleBar) {
                    try {
                        if (_this.wrap.find(".hd_title").find("h2") && !_this._titleLazy) {
                            bridge.push("setTitle", {
                                title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                            });
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            },
            setBeforePageOut: function () {
                var el = document.getElementById("fd_text");
                el && el.blur();
            },
            //静态
            _renderStatic: function () {
                var _this = this;
                var tpl = dd.ui.tmpl(tpl_my_fd.html());
                _this.wrap.html(tpl);
                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    title: "发送"
                }, function () {

                });
            },
            _renderDynamic: function () {
                var _this = this;
//                _this.wrap.find("#fd_text")[0].focus();
            },
            menuEvent: "_checkFeedBack",
            _sendFeedBack: function (param) {
                var _this = this, device;
                if (device = dd.device) {
                    var client = dd._env ? "0" : "1", os, network = device.nw || "none", rl = device.rl, devName;
                    if (device.version) {
                        for (var i  in device.version) {
                            if (device.version[i]) {
                                os = device.version[i];
                                devName = i;
                            }
                        }
                    }
                    param.info = [client, os, devName, "", network, rl].join(":");
                }
                //点点
                lib.mtop.request({
                    api: 'com.taobao.client.user.feedback',
                    v: '*',
                    data: {
                        content: param.content,
                        appInfo: "1:7.11:::wifi:640x1136",
                        apptype: "dd_h5"
                    },
                    extParam: {}
                }, function (data) {
                    if (data.ret && data.ret[0] && data.ret[0].indexOf("SUCCESS") != -1) {
                        dd.ui.toast("反馈成功");
                        dd.lib.ddState({
                            'push': {
                                'ddid': "my",
                                'obj': {
                                    'referer': 'my_feedback'
                                }
                            }
                        });
                    } else {
                        dd.ui.toast("反馈失败，请重试");
                    }
                }, function (data) {
                    dd.ui.toast(data, _this)
                });

            },
            events: [
                [dd.event.click, '#J_send_fd', '_checkFeedBack'],
                [dd.event.click, '#fd_text', '_focusText']
            ],
            _focusText: function (e) {
                var tar = e.target;
                tar && tar.focus();
            },
            _checkFeedBack: function () {
                var _this = this, param = {}, el = document.getElementById("fd_text"), val;
                if (el) {
                    val = el.value;
                }
                val = val.replace(/^\s+|\s+$/gm,'');
                if (val) {
                    param.content = val;
                } else {
                    dd.ui.toast("请输入内容");
                    return;
                }
                el.blur();
                _this._sendFeedBack(param);
            }
        }
    }

    dd.app.MyFeedBack = function () {
        return new MyFeedBack;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的菜单
 */
(function($, window, dd){
	var my_order_panel = $('#J_my_order'),
		tpl_my_order = $('#J_tpl_my_order'),
		tpl_my_order_list = $('#J_tpl_my_order_list');

	var my_order_t1_list, //未下单
		my_order_t2_list, //待评价
		my_order_t3_list, //全部订单
        my_order_list;

	var History = window.History,
        bridge = window.bridge;

	function Myorder() {
		return {
			wrap: my_order_panel,
			init: function() {
				var _this = this;

				_this._scroll = undefined;

				_this.asnyc = false; //
				//_this.pulldown_el = undefined; //刷新pull
				_this.pullup_el = undefined; //加载pull

				_this.page = {
					'ps': '10', //每页条数
					'type': '7', //类型, 7所有 2待评价
					//'total_t1': 0, //未下单总数
					'total_t2': 0, //待评价总数
					'total_t7': 0, //历史订单总数
					//'pages_t1': 0, //未下单总页数
					'pages_t2': 0, //待评价总页数
					'pages_t7': 0, //历史订单总页数
					//'page_current_t1': 1, //未下单当前页
					'page_current_t2': 1, //待评价当前页
					'page_current_t7': 1 //历史订单当前页
				}

				_this.initHandler();
			},
			initHandler: function(){
				this._renderStatic();
				this._renderDynamic();
			},
			//静态模板
			_renderStatic: function(){
				var _this = this;

				var options = {
					'swipeid': History.getState().data.referer || 'my'
				};
				var tpl = dd.ui.tmpl(tpl_my_order.html(), options);
				my_order_panel.html(tpl);

				//loading
				//my_order_panel.find('#J_my_order_t3_list').html(dd.ui.tpl.load);

				my_order_list = $('#J_my_order_list');
				//my_order_t1_list = $('#J_my_order_t1_list');
				my_order_t2_list = my_order_panel.find('#J_my_order_t2_list');
				my_order_t3_list = my_order_panel.find('#J_my_order_t3_list').html(dd.ui.tpl.load);
				//_this.pulldown_el = my_order_panel.find('.J_pulldown');
				_this.pullup_el = my_order_panel.find('.J_pullUp');
			},
			//动态渲染
			_renderDynamic: function(){
				var _this = this;
                bridge.push("login", function () {
                    _this._getMyOrder('refresh');
                });
			},
			_getMyOrder: function(type){
				var _this = this;
				_this.asnyc = true;
				
				lib.mtop.request({
					api: 'mtop.life.diandian.myOrderList',
					v: '1.0',
					data: {
						'pn': _this.page['page_current_t'+_this.page.type],
						'ps': _this.page.ps,
						'type': _this.page.type //未下单
					}
				}, function(data) {
					var _data = data.data;
					if (_data) {
						_this.page['total_t'+_this.page.type] = _data.total;
						_this.page['pages_t'+_this.page.type] = Math.ceil(parseInt(_data.total)/_this.page.ps);

						_this._buildTmpl(type, _data)
					}
					_this.asnyc = false;
				}, function(data) {
					if(type!=='refresh') {
						_this.page['page_current_t'+_this.page.type]--;
					}
					dd.ui.toast(data, _this);
					_this.asnyc = false;
				});
			},
			_buildTmpl: function(type, _data) {
				var _this = this;
				if(!_this._scroll) {
					//_this.pulldown_el.removeClass('dn');
					_this._iScrollInit();
				}

				_this.startUp(type, _data)
			},
			//渲染列表
			startUp: function(type, data){
				var _this = this;
				var tpl = dd.ui.tmpl(tpl_my_order_list.html(), data);

				var list_item = my_order_list.children().eq($('#J_my_ul_tree li.current').index());

				//刷新前清空
				if(type == 'refresh') {
					list_item.html('');

					//重置当前页码
					_this.page['page_current_t'+_this.page.type] = 1;
				}

				list_item.append(tpl).show();

				_this._switchHandler();

				dd.ui.toast.hide();
				
			},

            events: [
                [dd.event.click, '#J_my_ul_tree li', '_liHandler'],
                [dd.event.click, '.J_order_del', '_delHandler'],
                [dd.event.click, '.J_order_item', '_itemHandler'],
                [dd.event.click, '.J_order_modify', '_modifyHandler'],
                [dd.event.click, '.J_order_add', '_addHandler'],
                [dd.event.click, '.J_order_confirm_high', '_confirmHighHandler']
            ],

            _liHandler: function(e,el){
            	var _this = this;
            	var $el = $(el);
				if(_this.asnyc) {
					return
				}

				if($el.hasClass('current')) {
					return;
				}

				$el.addClass('current').siblings('.current').removeClass('current');

				_this.page.type = $el.data('type');

				var list_item = my_order_list.children().eq($el.index());

				if(!list_item.html()) {
					list_item.html(dd.ui.tpl.load);
					list_item.show().siblings().hide();
					_this.pullup_el.addClass('dn');
					_this._getMyOrder('refresh');
				}else{
					list_item.show().siblings().hide();
					_this._switchHandler();
				}
            },
            //删除
            _delHandler: function(e, el){
            	var _this = this;
				var $el = $(el);

                bridge.push('confirm', {
                        title:'提示',
                        message:'删除这个点菜单？',
                        okButton: '确定',
		                cancelButton: '取消'
                }, function (result) {
                    if(result.ok) {
                        dd.ui.toast.loading();
                        lib.mtop.request({
                            api: 'mtop.life.diandian.deleteOrder',
                            v: '1.0',
                            data: {
                                'orderId': $el.parent().data('id')
                            }
                        }, function(data) {
                            var _data = data.data;
                            if (_data) {
                                //成功
                                $el.parents('.my_order_item').remove();
                                _this._scroll.refresh();
                            }
                            dd.ui.toast.hide();
                            _this.asnyc = false;
                        }, function(data) {
                            dd.ui.toast(data);
                            _this.asnyc = false;
                        });
                    }
                });
            },
            _itemHandler: function(e, el){
            	$('#J_my_order_details').removeAttr('data-ddid');
				var sid = $(el).data('swipeid');
				var state_obj = {
					'push': {
			            'ddid': sid
			        }
				};
				dd.lib.ddState(state_obj);
            },
            //修改
            _modifyHandler: function(e,el){
            	var _this = this;

            	dd.common.myOrder.modify({
            		'orderId': $(el).parent().data('id'),
                	'type': 'edit'
            	});
            },

            //加菜
            _addHandler: function(e,el){
                var par = $(el).parent();
                dd.common.myOrder.add({
                    orderId: par.attr('data-id'),
                    storeId: par.attr('data-storeid')
                });
            },
            //下单
            _confirmHighHandler: function(e, el){
            	var _this = this;

            	var par_el = $(el).parent();

				dd.common.myOrder.confirmHigh({
                    'fromType': dd.config.getScanFromTypeByServiceType(par_el.data('servicetype')),
					'orderId': par_el.data('id'),
					'storeId': par_el.data('storeid'),
					'time': par_el.data('time'),
					'view': _this,
					'ddid': 'my_order'
				});
            },
			//切换后逻辑
			_switchHandler: function(){
				var _this = this,
					page = _this.page,
					type = page.type;

				//判断是否有翻页
				if(page['pages_t'+type] > 1 && page['page_current_t'+type] < page['pages_t'+type]) {
					_this.pullup_el.removeClass('dn');
				}else{
					_this.pullup_el.addClass('dn');
				}
				_this._scroll.refresh();
				
			},
			//滚动初始化
			_iScrollInit: function(){
				var _this = this;

				this._scroll = dd.ui._scroll({
					'wrap': '#J_my_order_scroll',
					'pullUpAction': function(){
						_this._pullUpAction()
					}
				})
			},
			/*_pullDownAction: function() {
				//刷新
				var _this = this,
					page = _this.page,
					type = page.type;

				//重置当前页
				page['page_current_t'+type] = 1;

				_this._getMyOrder('refresh');
			},*/
			_pullUpAction: function(){
				//加载
				var _this = this,
					page = _this.page,
					type = page.type;

				//页码+1
				page['page_current_t'+type]++;

				_this._getMyOrder('add');
			}
		}
	}

	dd.app.Myorder = function() {
		return new Myorder;
	};
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的订单详情
 */
(function($, window, dd){
	var my_order_details_panel = $('#J_my_order_details'),
		tpl_my_order_details = $('#J_tpl_my_order_details');

	var bridge = window.bridge;

	function MyOrderDetails() {
		return {
			wrap: my_order_details_panel,

            init: function(arg1) {
				var _this = this;

				_this.id = arg1;

				_this.mainScroll = undefined;

				_this.initHandler();
			},

			initHandler: function(){
				this._renderStatic();
				this._renderDynamic();
			},

            setAfterPageIn: function () {
                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: dd.config.option_menu_icon.share
                });
            },

			//静态
			_renderStatic: function(){
				var _this = this;

				var options = {
					//'swipeid': History.getState().data.referer || 'my_order'
				};
				/*var tpl = dd.ui.tmpl(tpl_my_order_details.html(), options);
				my_order_details_panel.html(tpl);*/

				//loading
				my_order_details_panel.html(dd.ui.tpl.load);
			},

			//动态
			_renderDynamic: function(){
				var _this = this;
                bridge.push("login", function () {
                    _this._getMyOrderDetail();
                });
			},
			_getMyOrderDetail: function(){
				var _this = this;

				lib.mtop.request({
					api: 'mtop.life.diandian.myOrderDetail',
					v: '1.0',
					data: {
						'id': _this.id,
						'option': dd.lib.memCache.get('checkoption')?'1':'0' //0默认, 1计算是不是预定
					}
				}, function(data) {
					if(data.data) {
						_this.startUp(data.data);
                        bridge.push("setTitle", {
                            title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                        });
					}
					dd.lib.memCache.removeValue('checkoption')
				}, function(data) {
					dd.ui.toast(data, _this);
					dd.lib.memCache.removeValue('checkoption')
				});
			},
			startUp: function(data) {
				var _this = this;

				_this.data = data;

				var tpl = dd.ui.tmpl(tpl_my_order_details.html(), {'data':data});
				my_order_details_panel.html(tpl);

				_this.storeId = data.storeInfo.storeId;

				//_this._iScrollInit();

				var confirmType = dd.lib.memCache.get('confirmType');
				if(confirmType) {

					if (confirmType==1) {
						//触发下单&支付
						_this._confirmHighHandler();
						dd.lib.memCache.removeValue('confirmType')
						return
				    }

					var str;
					if (confirmType==3) {
			        	str = '下单成功，坐等开吃';
				    }else if(confirmType==4) {
				        str = '菜单已保存！请您到店入座后扫描餐桌上的二维码下单';
				    }else if(confirmType==5) {
				        str = '加菜成功';
				    }else if(confirmType == 6) {
				    	//增加基础版7类型，为已经到店，6为未到店
						str = '菜单保存成功！到店后请联系服务员下单！';
					}else if(confirmType==8){
                        //前支付暂不支付情况
                        str = '菜单已保存！请您到店后扫码支付';
                    }

                    if (confirmType == 7 || confirmType == 3) {
                        bridge.push('alert', {
                            title: '下单成功！',
                            message: '请联系服务员确认您所点的菜品！',
                            buttons: ['确定']
                        });
                    }

					dd.ui.toast(str);
					dd.lib.memCache.removeValue('confirmType')
				}

                if((data.operation&2)==2 && (confirmType&5)!==5) {
					//提示是否去预定
					setTimeout(function(){
						bridge.push('confirm', {
		                    title: '菜单已保存',
		                    message: '本店支持预订，是否要提前预订？',
		                    okButton: '确定',
		                    cancelButton: '取消'
		                }, function (result) {
		                    if(result.ok) {
		                        dd.lib.ddState({
                                    'push':{
                                        'ddid': 'reserve_datelist/'+_this.storeId,
                                        'obj': {
                                            'referer': 'my_order_details/'+_this.id
                                        }
                                    }
                                })
		                    }
		                });
					},100);
				}
			},

            menuEvent: '_shareMenu',
			events: [
                [dd.event.click, '.J_order_modify', '_modifyHandler'],
                [dd.event.click, '.J_order_add', '_addHandler'],
                [dd.event.click, '.J_order_confirm_high', '_confirmHighHandler'],
                [dd.event.click, '.J_shop_address','_pushMap'],
                [dd.event.click, '.J_order_review','_pushReview'],
                [dd.event.click, '.J_Share','_shareMenu']
            ],
			//修改
            _modifyHandler: function(e,el){
            	dd.common.myOrder.modify({
            		'orderId': $(el).data('orderid'),
                	'type': $(el).data('type')
            	})
            },

            _addHandler: function(){
                var _this = this;
                dd.common.myOrder.add({
                    orderId: _this.id,
                    storeId: _this.storeId
                });
            },
            _confirmHighHandler: function(){
            	var _this = this;
            	dd.common.myOrder.confirmHigh({
                    'fromType': dd.config.getScanFromTypeByServiceType(_this.data.serviceType),
					'orderId': _this.data.orderId,
					'storeId': _this.data.storeInfo.storeId,
					'time': _this.data.createTime,
					'view': _this,
					'ddid': 'my_order_details'
				});
            },
            _pushMap:function(){
                var _this = this,
                    v = 'address_map/show';
                $('#J_address_map').removeAttr('data-ddid');

                var state_obj = {
                    'push': {
                        'ddid': v,
                        'obj': {
                            'data': {
                                posx: _this.data.storeInfo.x,
                                posy: _this.data.storeInfo.y
                            },
                            'referer': 'store/' + _this.storeid
                        }
                    }
                };
                dd.lib.ddState(state_obj);
            },

            _shareMenu: function(){
                var _this = this;
                bridge.push("share", {
                    title: '淘点点菜单秀',
                    content: '今天我吃了这些菜，用“淘点点”点菜方便又省钱！你也来试试～',
                    url: dd.config.share.jump + 'menu_id!/' + _this.data.storeInfo.storeId
                });
            },

            _pushReview: function(){
                var _this = this;
                dd.lib.ddState({
                    'push': {
                        'ddid': 'review/' + _this.data.orderId,
                        'obj': {
                            'referer': 'my_order_details',
                            'orderData': _this.data
                        }
                    }
                })
            }
		}
	}

	dd.app.MyOrderDetails = function() {
		return new MyOrderDetails;
	};
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的支付列表
 */
(function ($, window, dd) {
    var my_pay_panel = $('#J_my_pay'),
        tpl_my_pay = $('#J_tpl_my_pay'),
    //tpl_my_order_content = $('#J_tpl_my_order_content'),
        tpl_my_pay_list = $('#J_tpl_my_pay_list');

    /*
     var my_pay_t1_list, //未下单
     my_pay_t2_list, //待评价
     my_pay_t3_list; //全部订单

     var my_order_list;*/

    var History = window.History,
        bridge = window.bridge;

    function MyPay() {
        return {
            wrap: my_pay_panel,

            my_pay_list: {},

            init: function () {
                var _this = this;

                _this._scroll = undefined;

                _this.asnyc = false; //
                //_this.pulldown_el = undefined; //刷新pull
                _this.pullup_el = undefined; //加载pull

                _this.page = {
                    'limit': '10', //每页条数
                    'total': 0, //未下单总数
                    'pages': 0, //未下单总页数
                    'page_current': 1 //未下单当前页
                };

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                };
                var tpl = dd.ui.tmpl(tpl_my_pay.html(), options);
                my_pay_panel.html(tpl);

                my_pay_list = $('#J_my_pay_list').html(dd.ui.tpl.load);

                //_this.pulldown_el = my_pay_panel.find('.J_pulldown');
                _this.pullup_el = my_pay_panel.find('.J_pullUp');
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                bridge.push("login", function () {
                    _this._getMyOrder('refresh');
                });
            },
            _getMyOrder: function (role) {
                var _this = this;
                _this.asnyc = true;

                lib.mtop.request({
                    api: 'mtop.dd.order.getListByUid',
                    v: '1.0',
                    data: {
                        'limit': _this.page.limit,
                        'offset': (parseInt(_this.page['page_current']) - 1) * parseInt(_this.page.limit)
                    }
                }, function (data) {
                    var _data = data.data;
                    if (_data) {
                        //统计页数
                        _this.page['total'] = _data.total;
                        _this.page['pages'] = Math.ceil(parseInt(_data.total) / _this.page.limit);

                        _this._buildTmpl(role, _data)
                    }
                    _this.asnyc = false;
                }, function (data) {
                    dd.ui.toast(data, _this);
                    _this.asnyc = false;
                    if (role !== 'refresh') {
                        _this.page['page_current']--;
                    }
                });
            },
            _buildTmpl: function (role, _data) {
                var _this = this;
                if (!_this._scroll) {
                    //my_pay_panel.find('.J_pulldown').removeClass('dn');
                    _this._iScrollInit();
                }

                _this.startUp(role, _data)
            },
            //渲染列表
            startUp: function (role, data) {
                var _this = this;
                data.swipeid = History.getState().data.referer || 'my';

                for (var temp = {}, i = data.list.length - 1; i >= 0; --i) {
                    temp[i] = data.list[i];

                    _this.my_pay_list[temp[i].taobaoOrderNo] = temp[i];
                }

                var tpl = dd.ui.tmpl(tpl_my_pay_list.html(), data);

                //var list_item = my_pay_list.children().eq(parseInt(_this.page.type)-1);

                //刷新前清空
                if (role == 'refresh') {
                    my_pay_list.html('');

                    //重置当前页码
                    _this.page['page_current'] = 1;
                }

                my_pay_list.append(tpl).show();//.siblings().hide();

                _this._switchHandler();
            },

            events: [
                [dd.event.click, '.J_order_pay', '_orderPay'],
                [dd.event.click, '.J_order_review', '_orderReview']
            ],

            _orderReview: function(e, el){
                var _this = this,
                    orderId = $(el).attr('data-id');

                dd.lib.ddState({
                    'push': {
                        'ddid': 'review/' + orderId,
                        'obj': {
                            'referer': 'my_pay',
                            'orderData': _this.my_pay_list[orderId]
                        }
                    }
                });
            },

            _orderPay: function (e, el) {
                var _this = this;

                var $el = $(el),
                    orderId = $el.attr('data-id'),
                    alipay_id = $el.attr('data-alipay');

                if (!alipay_id) {
                    dd.lib.memCache.set('pay_detail', _this.my_pay_list[orderId]);

                    dd.lib.ddState({
                        'push': {
                            'ddid': 'pay_detail' + '/' + _this.my_pay_list[orderId].localstoreId,
                            'obj': {
                                'referer': 'my_pay'
                            }
                        }
                    });
                    return;
                }

                if (_this.async) {
                    return;
                }
                _this.async = true;

                !bridge.supportFunc("tradePay") && dd.ui.toast.loading();

                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        "tradeNO": alipay_id
                    }, function (result) {
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            _this.initHandler();
                        }
                        _this.async = false;
                    })
                }
                else {
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': _this.my_pay_list[orderId].taobaoOrderId,
                            'payType': 0
                        },
                        extParam: {}
                    }, function (data) {
                        if (data.data) {
                            if (data.data.canPay == 'true') {
                                if (dd.device.isAndroid && dd.device.version.android < 4) {
                                    location.href = data.data.alipayUrl;
                                    return
                                }
                                dd.ui.alipay({
                                    'alipayUrl': data.data.alipayUrl,
                                    'successFunc': function () {
                                        _this.initHandler()
                                    }
                                });
                            }
                        }
                        dd.ui.toast.hide();
                        _this.async = false;
                    }, function (data) {
                        dd.ui.toast(data);
                        _this.async = false;
                    });
                }
            },

            /*_tabLiHandler: function (e, el) {
             var _this = this;
             var $el = $(el);
             if (_this.asnyc) {
             return
             }

             if ($el.hasClass('current')) {
             return;
             }

             $el.addClass('current').siblings('.current').removeClass('current');

             var i = $el.index() + 1;
             _this.page.type = i.toString();

             var list_item = my_pay_list.children().eq($el.index());

             if (!list_item.html()) {
             list_item.html(dd.ui.tpl.load);
             list_item.show().siblings().hide();
             _this.pullup_el.addClass('dn')
             _this._getMyOrder('refresh');
             } else {
             list_item.show().siblings().hide();
             _this._switchHandler();
             }
             },*/
            //切换后逻辑
            _switchHandler: function () {
                var _this = this,
                    page = _this.page;

                //判断是否有翻页
                if (page['pages'] > 1 && page['page_current'] < page['pages']) {
                    _this.pullup_el.removeClass('dn');
                } else {
                    _this.pullup_el.addClass('dn');
                }
                _this._scroll.refresh();

            },
            //滚动初始化
            _iScrollInit: function () {
                var _this = this;
                this._scroll = dd.ui._scroll({
                    'wrap': '#J_my_pay_scroll',
                    'pullUpAction': function () {
                        _this._pullUpAction()
                    }
                })
            },
            _pullUpAction: function () {
                //加载
                var _this = this,
                    page = _this.page;

                //页码+1
                page['page_current']++;

                _this._getMyOrder('add');
            }
        }
    }

    dd.app.MyPay = function () {
        return new MyPay;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的支付详情
 */
(function ($, window, dd) {
    var my_pay_details_panel = $('#J_my_pay_details'),
        tpl_my_pay_details = $('#J_tpl_my_pay_details');
        //tpl_my_pay_details_content = $('#J_tpl_my_pay_details_content');


    var History = window.History,
        bridge = window.bridge;

    function MyPayDetails() {
        return {
            wrap: my_pay_details_panel,

            init: function (arg1) {
                var _this = this;

                _this.id = arg1;

                _this.initHandler();
            },

            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },

            setAfterPageIn: function () {
                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: dd.config.option_menu_icon.share
                });
            },

            //静态模板
            _renderStatic: function () {
                this.wrap.html(dd.ui.tpl.load);
            },

            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.dd.order.get',
                    v: '1.0',
                    data: {
                        'orderNo': _this.id
                    }
                }, function (data) {
                    if (data.data) {
                        _this.data = data.data;
                        _this.startUp(_this.data);
                        bridge.push("setTitle", {
                            title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                        });
                    }

                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },

            startUp: function (data) {
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_my_pay_details.html(), {
                    'data': data,
                    'swipeid': History.getState().data.referer || 'my_pay'
                });

                my_pay_details_panel.html(tpl);

                if (data.payStatus == '0') {
                    _this.tradeInfo = data;
                }
            },

            menuEvent: '_shareMenu',

            events: [
                [dd.event.click, '#J_my_pay_detail_btn', '_payHandler'],
                [dd.event.click, '#J_my_pay_detail_review', '_reviewHandler'],
                [dd.event.click, '.J_Share', '_shareMenu']
            ],

            _reviewHandler: function(){
                var _this = this;

                dd.lib.ddState({
                    'push': {
                        'ddid': 'review/' + _this.data.orderNo,
                        'obj': {
                            'referer': 'my_pay',
                            'orderData': _this.data
                        }
                    }
                });
            },

            _payHandler: function () {
                var _this = this,
                    tradeinfo = _this.tradeInfo;

                if(!tradeinfo.alipayTradeIds || !tradeinfo.taobaoOrderIds){
                    dd.lib.memCache.set('pay_detail', tradeinfo);
                    dd.lib.ddState({
                        'push': {
                            'ddid': 'pay_detail/' + tradeinfo.localstoreId,
                            'obj': {
                                'referer': 'my_pay_details'
                            }
                        }
                    });
                    return;
                }

                if (_this.async) {
                    return
                }
                _this.async = true;
                dd.ui.toast.loading();

                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        "tradeNO": tradeinfo.alipayTradeIds
                    }, function (result) {
                        dd.ui.toast.hide();
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            _this.initHandler();
                        }
                        _this.async = false;
                    })
                } else {
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': tradeinfo.taobaoOrderIds,
                            'payType': 0
                        }
                    }, function (data) {
                        if (data.data) {
                            if (data.data.canPay == 'true') {
                                if (dd.device.isAndroid && dd.device.version.android < 4) {
                                    location.href = data.data.alipayUrl;
                                    return;
                                }
                                dd.ui.alipay({
                                    'title': '支付',
                                    'alipayUrl': data.data.alipayUrl,
                                    'successFunc': function () {
                                        _this.initHandler()
                                    }
                                });
                            }
                        }
                        dd.ui.toast.hide();
                        _this.async = false;
                    }, function (data) {
                        dd.ui.toast(data);
                        _this.async = false;
                    });
                }
            },

            _shareMenu: function(){
                var _this = this;

                bridge.push("share", {
                    title: _this.data.title,
                    content: '【'+ _this.data.title +'】可以用淘点点买单，超级方便，推荐你也试试',
                    image: 'http://gtms04.alicdn.com/tps/i4/T1kHywFuhdXXbYfSkc-640-1738.png',
                    url: dd.config.share.jump + 'store_id!/' + _this.data.localstoreId
                });
            }
            //滚动初始化
            /*
            _iScrollInit: function () {
                var _this = this;
                _this.mainScroll && _this.mainScroll.destroy();

                 _this.mainScroll = dd.ui.scroll({
                 'view': _this,
                 'wrap': '#J_my_pay_details_scroll'
                 });

            }*/
        }
    }

    dd.app.MyPayDetails = function () {
        return new MyPayDetails;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的-预定
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var History = window.History;
    var my_reserve = $('#J_my_reserve'),
        tpl_my_reserve = $('#J_tpl_my_reserve'),
        my_reserve_content,
        my_reserve_list = {},
        tpl_my_reserve_list = $('#J_tpl_my_reserve_item');

    function MyReserve() {
        return {
            wrap: my_reserve,
            init: function () {
                var _this = this;
                _this.options = {
                    "reserveList": {}
                };

                _this.page = {
                    'pz': 10, //每页条数
                    'p': 1, //当前页
                    'total': 0, //订单总数
                    'pTotal': 1 //总页数
                };

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;
                var options = {
                    'swipeid': History.getState().data.referer || 'my'
                };
                var tpl = dd.ui.tmpl(tpl_my_reserve.html(), options);
                my_reserve.html(tpl);

                //loading
                my_reserve_content = my_reserve.find('#J_my_reserve_list').html(dd.ui.tpl.load);

                //_this.pulldown_el = my_delivery_panel.find('.J_pulldown');
                _this.pullup_el = my_reserve.find('.J_pullUp');
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                bridge.push("login", function () {
                    _this._getMyReserve('refresh');
                });
            },
            _getMyReserve: function (type) {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.dd.reserve.order.search',
                    v: '1.0',
                    data: {
                        'pageSize': _this.page.pz,
                        'pageNo': _this.page.p
                    }
                }, function (data) {
                    var _data = data.data;
                    if (_data) {
                        _this.page['total'] = _data.count;
                        _this.page['pTotal'] = Math.ceil(parseInt(_data.count) / _this.page.pz);
                        _this._buildList(type, _data);
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                    if (type !== 'refresh') {
                        _this.page.p--;
                    }
                });
            },
            _setExtraDetail: function (obj) {
                obj.valid = obj.status == "22" ? "" : "my_reserve_logo_new";
                if (obj.status == "1") {
                    obj.btnStatus = "reservation_pay_btn";
                    obj.btnText = "付款";
                } else if (obj.status == "20" || obj.status == "21" || obj.status == "22") {
                    obj.btnStatus = "redo_btn";
                    obj.btnText = "再订";
                } else if (obj.status == "1201") {
                    obj.btnStatus = "pay_btn";
                    obj.btnText = "买单";
                } else if (obj.status == "12") {
                    obj.btnStatus = "pay_btn";
                    obj.btnText = "买单";
                } else if (obj.status == "1299") {
                    obj.btnStatus = "scan_btn";
                    obj.btnText = "下单";
                } else {
                    obj.btnStatus = "hide_btn";
                }
                if (obj.reserveTime) {
                    var date = obj.reserveTime.match(/\d+-\d+-\d+|\d+:\d+/gi),
                        index = new Date(date[0]).getDay(),
                        day = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
                    obj.showTime = [date[0], day[index], date[1]].join(" ");
                }
            },
            _buildList: function (type, data) {
                var _this = this,
                    temp = {};

                for (var i = data.list.length - 1; i >= 0; --i) {
                    temp[i] = data.list[i];
                    _this._setExtraDetail(temp[i]);
                    my_reserve_list[temp[i].id] = temp[i];
                }
                var tpl = dd.ui.tmpl(tpl_my_reserve_list.html(), data);

                //刷新前清空
                if (type == 'refresh') {
                    my_reserve_content.html('');
                    //重置当前页码
                    _this.page.p = 1;
                }
                _this.startUp(tpl);

                if (type == 'refresh') {
                    //_this.pulldown_el.removeClass('dn');
                    _this._iScrollInit();
                }

                _this._manualHandler();
            },
            _manualHandler: function () {
                var _this = this,
                    page = _this.page;

                //判断是否有翻页
                if (page['pTotal'] > 1 && page['p'] < page['pTotal']) {
                    _this.pullup_el.removeClass('dn');
                } else {
                    _this.pullup_el.addClass('dn');
                }
                _this._scroll.refresh();
            },
            startUp: function (tpl) {
                my_reserve_content.append(tpl);
            },
            events: [
                [dd.event.click, '.my_order_item', '_goDetail']//详情
            ],
            _myChildPush: function (ddid, id) {
                dd.lib.ddState({
                    'push': {
                        'ddid': ddid,
                        'obj': {
                            'referer': 'my_reserve',
                            'id': id
                        }
                    }
                });
            },
            _goDetail: function (e, el) {
                var _this = this,
                    tar = e.target,
                    $el = $(el),
                    id = $(el).attr("rel"), //预定订单ID
                    sid = $el.attr('data-swipeid');

                switch (true) {
                    //付款
                    case $(tar).hasClass('reservation_pay_btn'):
                        _this._doReservationPay(tar);
                        break;
                    //再订
                    case $(tar).hasClass('redo_btn'):
                        _this._doRedo(id);
                        break;
                    //买单
                    case $(tar).hasClass('pay_btn'):
                        _this._doPay(id);
                        break;
                    //下单(我的预定—下单功能暂时移除)
                    /*case $el.hasClass('scan_btn'):
                     _this._doScanQRCode(tar);
                     break;*/
                    default:
                        bridge.push("login", function () {
                            _this._myChildPush(sid, id);
                        });
                        break;
                }
            },

            /*_doScanQRCode: function (el) {
             bridge.push("scan", {
             type: 'qr'
             }, function () {
             alert(JSON.stringify(arguments[0]));
             });
             },*/

            //重新预定
            _doRedo: function (id) {
                dd.lib.ddState({
                    'push': {
                        'ddid': 'reserve_datelist/' + my_reserve_list[id].localstoreId,
                        'obj': {
                            'referer': 'my_reserve'
                        }
                    }
                });
            },

            //买单
            _doPay: function (id) {
                var data;
                if (id && (data = my_reserve_list[id])) {
                    if (data.status == '12') {
                        dd.ui.toast("到达预订时间后才能买单哦");
                    } else {
                        //标志预定来源
                        data.reserve = 1;
                        dd.lib.memCache.set('pay_detail', data);

                        dd.lib.ddState({
                            'push': {
                                'ddid': 'pay_detail/' + data.localstoreId,
                                'obj': {
                                    'referer': 'my_reserve'
                                }
                            }
                        });
                    }
                }
            },

            //预定付款
            _doReservationPay: function (el) {
                var _this = this,
                    tar = $(el).parents('.my_order_item'),
                    id = tar.length && tar.attr("rel");

                if (id && my_reserve_list[id]) {
                    var data = my_reserve_list[id];

                    if (!data.taobaoOrderId) {
                        dd.ui.toast("支付宝订单不存在");
                    } else {
                        _this._aliPay(data, 0);
                    }
                }
            },

            _aliPay: function (data, type) {
                var _this = this,
                    contents = ["预订支付", "确定买单"],
                    title = contents[type] || "";
                if (this.async) {
                    return
                }
                this.async = true;

                !bridge.supportFunc("tradePay") && dd.ui.toast.loading();

                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        "tradeNO": data.alipayOrderId
                    }, function (result) {
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            _this.initHandler();
                        }
                        _this.async = false;
                    })
                } else {
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': data.taobaoOrderId,
                            'payType': 0
                        }
                    }, function (data) {
                        if (data.data) {
                            if (data.data.canPay == 'true') {
                                dd.ui.alipay({
                                    'title': title,
                                    'alipayUrl': data.data.alipayUrl,
                                    'successFunc': function () {
                                        _this.initHandler();
                                    }
                                });
                            }
                        }
                        dd.ui.toast.hide();
                        _this.async = false;
                    }, function (data) {
                        dd.ui.toast(data);
                        _this.async = false;
                    });
                }
            },

            //滚动初始化
            _iScrollInit: function () {
                var _this = this;
                this._scroll = dd.ui._scroll({
                    'wrap': '#J_my_reserve_scroll',
                    'pullUpAction': function () {
                        _this._pullUpAction()
                    }
                })
            },
            _pullDownAction: function () {
                //刷新
                var _this = this,
                    page = _this.page,
                    type = page.type;

                //重置当前页
                page.p = 1;

                _this._getMyReserve('refresh');
            },
            _pullUpAction: function () {
                //加载
                var _this = this,
                    page = _this.page;

                //页码+1
                page['p']++;

                _this._getMyReserve('add');
            }
        }
    }

    dd.app.MyReserve = function () {
        return new MyReserve;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的-预定详情
 */
(function ($, window, dd) {
    var History = window.History;
    var my_reserve_details = $('#J_my_reserve_details'),
        _orderData,
        _orderItems = {},
        dialog_content,
        galleryScroll,
        bridge = window.bridge,
        CLS_CURRENT = 'current',
        tpl_cartepop = $('#J_tpl_cartepop'),
        tpl_my_reserve_details = $('#J_tpl_my_reserve_details');

    function MyReserveDetails() {
        return {
            wrap: my_reserve_details,
            init: function () {
                var _this = this,
                    state_now = dd.lib.getUriParam(location.href, "_ddid"),
                    ddid_id,
                    params;

                if (state_now && (params = state_now.split("/") ) && params.length > 1) {
                    ddid_id = params[1];
                }
                _this.pages = {
                    id: History.getState().data.id || ddid_id
                };
                _this.initHandler();
            },
            initHandler: function () {
                this._renderDynamic();
            },

            setAfterPageIn: function () {
                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: dd.config.option_menu_icon.share
                });
            },

            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                bridge.push("login", function () {
                    _this._getReserveDetail();
                });
            },
            _goShop: function (el) {
                var id = $(el).data("swipeid");
                id && dd.lib.ddState({
                    'push': {
                        'ddid': id,
                        'obj': {
                            'referer': 'my_reserve_detail'
                        }
                    }
                });
            },
            _goMapMark: function () {
                if (_orderData.posX && _orderData.posY) {
                    var v = 'address_map/show';
                    $('#J_address_map').removeAttr('data-ddid');

                    var state_obj = {
                        'push': {
                            'ddid': v,
                            'obj': {
                                'data': {
                                    posx: _orderData.posX,
                                    posy: _orderData.posY
                                },
                                'referer': 'store/' + _orderData.localstoreId
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            },
            _getReserveDetail: function () {
                var _this = this;
                dd.ui.toast.loading();
                lib.mtop.request({
                    api: 'mtop.dd.reserve.order.detail',
                    v: '1.1',
                    data: {
                        'orderNo': _this.pages.id,
                        'fromAlipay': 0
                    }
                }, function (data) {
                    var _data = data.data;
                    if (_data) {
                        _orderData = _data;
                        dd.ui.toast.hide();
                        _this._serializeData();
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            _serializeData: function () {
                var _this = this,
                    _items = [],
                    list = _orderData;

                if (list.items) {
                    for (var i in list.items) {
                        var temp = {};
                        temp['itemId'] = list.items[i]['itemId'];
                        temp['itemName'] = list.items[i]['itemName'];
                        temp['count'] = list.items[i]['cnt'];
                        temp['oriPrice'] = list.items[i]['orgPrice'];
                        temp['itemPrice'] = list.items[i]['price'];
                        temp['totalPrice'] = list.items[i]['add'];
                        list.items[i]['image'] && (temp['picPath'] = list.items[i]['image']);
                        temp['showPic'] = temp['picPath'] ? "reverve_pic_icon" : "";
                        temp['hasPic'] = temp['picPath'] ? "show_pic" : ""
                        temp['itemPrice'] = (100 * temp['itemPrice']) % 100 ? parseFloat(temp['itemPrice']).toFixed(2) : parseInt(temp['itemPrice']);
                        _items.push(temp);
                    }
                    list.items = _items;
                }
                var btnText,
                    btnCls,
                    oriMoney = list.real || 0;

                switch (list.status) {
                    case "1":
                        btnText = "付款";
                        btnCls = "reservation_pay_btn"
                        break;
                    case "20":
                    case "21":
                    case "22":
                        btnText = "再订";
                        btnCls = "redo_btn"
                        break;
                    case "12":
                    case "1201":
                        btnText = "买单";
                        btnCls = "pay_btn"
                        break;
                    case "1299":
                        btnText = "扫码下单";
                        btnCls = "scan_btn";
                        break;
                }
                _this.auctionId = list.auctionId;
                if (list.reserveTime) {
                    var date = list.reserveTime.match(/\d+-\d+-\d+|\d+:\d+/gi),
                        index = new Date(date[0]).getDay(),
                        day = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
                    list.reserveTimeWithWeekday = [date[0], day[index], date[1]].join(" ");
                }
                _this.reserveTime = list.reserveTime;
                if (list.memo1) {
                    list.memo1 = "<p>" + list.memo1;
                    list.memo1 = list.memo1.replace(/\n/ig, "<p>");
                }
                list.btnText = btnText;
                list.btnCls = btnCls;
                list.oriMoney = 10 || oriMoney;
                var tpl = dd.ui.tmpl(tpl_my_reserve_details.html(), {detail: list});
                _this.wrap.html(tpl);
                bridge.push("setTitle", {
                    title: _this.wrap.find(".hd_title").find("h2").html() || "淘点点"
                });
                if (list.needTip == "1" && list.tip) {
                    _this.showAlertWithTitle(list.tip);
                }
                //_this._iScrollInit();
            },
            initDialog: function () {
                this._popdialog = dd.ui.dialog({
                    'cls': 'reserve_dialog',
                    'title': '',
                    'wrap': '#J_my_reserve_details',
                    'content': dd.ui.tpl.load,
                    'maxheight': '246'
                });
                dialog_content = this.wrap.find('.J_dialog_content');
            },
            //弹出
            _showCartePop: function (id) {
                var _this = this;

                _this.initDialog();
                if (!_orderItems[id]) {
                    if (_this.async) {
                        return;
                    }
                    _this.async = true;

                    lib.mtop.request({
                        api: 'mtop.life.diandian.getItemDetail',
                        v: '1.1',
                        data: {
                            'itemId': id,
                            'reserveId': _this.auctionId,
                            'reserveTime': _this.reserveTime,
                            'type': 1
                        },
                        extParam: {}
                    }, function (data) {
                        _orderItems[id] = data.data;
                        _this._renderPop(_orderItems[id]);
                        _this.async = false;
                    }, function (data) {
                        _this.async = false;
                    });
                }
                else {
                    _this._renderPop(_orderItems[id]);
                }

                /*dialog.show();
                 mask.show();*/
            },
            _renderPop: function (data) {console.log(data)
                var _this = this,
                    _itemPicUgcs = data.itemPicUgcs ? data.itemPicUgcs : [];

                data.width = window.document.body.clientWidth * 0.86 - 2;

                var tpl = dd.ui.tmpl(tpl_cartepop.html(), {data: data});

                dialog_content.html(tpl);
                this._popdialog.setTitle(data.itemName);
            },


            _aliPay: function (data, type) {
                var _this = this,
                    contents = ["预订支付", "确定买单"],
                    title = contents[type] || "";

                if (this.async) {
                    return
                }
                this.async = true;

                !bridge.supportFunc("tradePay") && dd.ui.toast.loading();

                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        "tradeNO": data.alipayOrderId
                    }, function (result) {
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            _this.initHandler();
                        }
                        _this.async = false;
                    })
                } else {
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': data.taobaoOrderId,
                            'payType': 0
                        }
                    }, function (data) {
                        if (data.data) {
                            if (data.data.canPay == 'true') {
                                dd.ui.alipay({
                                    'title': title,
                                    'alipayUrl': data.data.alipayUrl,
                                    'successFunc': function () {
                                        _this.initHandler()
                                    }
                                });
                            }
                        }
                        dd.ui.toast.hide();
                        _this.async = false;
                    }, function (data) {
                        dd.ui.toast(data);
                        _this.async = false;
                    });
                }
            },

            _doReservationPay: function () {
                var _this = this;
                if (!_orderData.alipayOrderId) {
                    dd.ui.toast("支付宝订单不存在");
                } else {
                    _this._aliPay(_orderData, 0);
                }
            },

            showAlertWithTitle: function (msg) {
                dd.ui.toast(msg);
            },

            menuEvent: '_shareMenu',

            events: [
                [dd.event.click, '.scroll_wrap', '_eventHandler'],
                [dd.event.click, '.btn_bottom_sub', '_btnHandler'],
                [dd.event.click, '.J_Share', '_shareMenu']
            ],
            _eventHandler: function (e, el) {
                var _this = this,
                    tar = e.target,
                    li,
                    cls;
                if (tar && (cls = tar.className)) {
                    cls.indexOf("shop_title_wrap") != -1 && _this._goShop(tar);
                    cls.indexOf("shop_address_wrap") != -1 && _this._goMapMark();
                    cls.indexOf("show_pic") != -1 && _this._showDetailImg(tar);
                    if ((li = $(tar).parents(".show_pic")) && li.length) {
                        _this._showDetailImg(li);
                    }
                }

            },
            _btnHandler: function (e, el) {
                var _this = this,
                    $el = $(el),
                    id = _orderData.id; //预定订单ID

                switch (true) {
                    //付款
                    case $el.hasClass('reservation_pay_btn'):
                        _this._doReservationPay(el);
                        break;
                    //再订
                    case $el.hasClass('redo_btn'):
                        _this._doRedo(id);
                        break;
                    //买单
                    case $el.hasClass('pay_btn'):
                        _this._doPay(id);
                        break;
                    //下单 (我的预定详情—下单功能暂时移除)
                    /*case $el.hasClass('scan_btn'):
                     _this._doScanQRCode(tar);
                     break;*/
                }
            },

            _doPay: function () {
                var id = _orderData['id'], data;
                if (id && (data = _orderData)) {
                    if (data.status == '12') {
                        dd.ui.toast("到达预订时间后才能买单哦");
                    } else {
                        //标志预定来源
                        data.reserve = 1;
                        dd.lib.memCache.set('pay_detail', data);

                        dd.lib.ddState({
                            'push': {
                                'ddid': 'pay_detail/' + data.localstoreId + '/' + data.id,
                                'obj': {
                                    'referer': 'my_reserve_detail'
                                }
                            }
                        });
                    }
                }
            },
            //重新预定
            _doRedo: function () {
                dd.lib.ddState({
                    'push': {
                        'ddid': 'reserve_datelist/' + _orderData.localstoreId,
                        'obj': {
                            'referer': 'my_reserve'
                        }
                    }
                });
            },
            _showDetailImg: function (el) {
                var id = $(el).data("rel");
                this._showCartePop(id);
            },

            _shareMenu: function(){
                bridge.push("share", {
                    title: '淘点点一键预订，真心靠谱！',
                    content: '用淘点点预订，支持预订的餐厅一目了然， 真心方便，靠谱！',
                    image: 'http://g.dd.alicdn.com/tps/i1/T1PV4wFy0jXXay7mDj-368-1000.png',
                    url: dd.config.share.jump + 'store_id!/' + _orderData.localstoreId
                });
            }
        }
    }

    dd.app.MyReserveDetails = function () {
        return new MyReserveDetails;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-预定-详情确认提交
 */
(function ($, window, dd) {
    var History = window.History;
    var reserve_confirm = $('#J_reserve_confirm'),
        tpl_reserve_confirm = $('#J_tpl_reserve_confirm');

    var bridge = window.bridge;

    function ReserveConfirm() {
        return {
            wrap: reserve_confirm,
            init: function () {
                var _this = this;
                //获取选项数据缓存
                _this.reserveDate = dd.lib.localStorage.get('reserve_date');

                _this.user_info = dd.lib.localStorage.get('reserve_user_info');

                _this.alt = History.getState().data.referer || 'reserve_datelist';

                _this.carte_data = History.getState().data.data;

                if (!_this.reserveDate) {
                    setTimeout(function () {
                        dd.lib.ddState({
                            'push': {
                                'ddid': 'reserve_shops'
                            }
                        });
                    }, 0);
                    return
                }

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            //静态模板
            _renderStatic: function () {
                this.wrap.html(dd.ui.tpl.load);
            },
            _titleLazy: true,
            //动态渲染
            _renderDynamic: function () {
                var _this = this,
                    tpl = dd.ui.tmpl(tpl_reserve_confirm.html(), {
                        alt: _this.alt,
                        data: _this.reserveDate,
                        carte: _this.carte_data,
                        name: _this.user_info ? _this.user_info.userName : null,
                        phone: _this.user_info ? _this.user_info.userPhone : null
                    });

                this.wrap.html(tpl);
                if (dd._hideTitleBar) {
                    try {
                        bridge.push("setTitle", {
                            title: _this.reserveDate.storeInfo.localstoreName || "淘点点"
                        });
                    } catch (e) {

                    }
                }
            },

            events: [
                [dd.event.click, '#J_PayBtn', '_payHandler']
            ],

            _payHandler: function () {
                var _this = this,
                    json = {},
                    para_array = $('#J_ReserveForm').serializeArray();

                para_array.forEach(function (obj) {
                    json[obj.name] = obj.value;
                });

                if (!json.userName.length) {
                    _this.showToast('请输入姓名');
                    return;
                }

                if (!json.userPhone.length) {
                    _this.showToast('请输入手机');
                    return;
                }
                //手机格式校验
                if (!(/^0?(13[0-9]|15[012356789]|18[0-9]|14[57])[0-9]{8}$/.test(parseInt(json.userPhone)))) {
                    _this.showToast('手机号格式不正确，请重新输入！');
                    return;
                }
                this.submitForm(json);
            },

            showToast: function (msg) {
                if (bridge.supportFunc("toast")) {
                    bridge.push("toast", {
                        content: msg
                    });
                }
                else {
                    dd.ui.toast(msg);
                }
            },

            submitForm: function (json) {
                var _this = this;

                !bridge.supportFunc("tradePay") && dd.ui.toast.loading();

                var api = _this.carte_data ? 'mtop.dd.reserve.order.confirmReserveOrderWithPreDD' : 'mtop.dd.reserve.order.insert';
                var version = _this.carte_data ? '1.1' : '1.0';

                if (_this.carte_data) {
                    var info = [];
                    $.each(_this.carte_data['cartViewList'], function (i, v) {
                        info.push(v.itemId + ':' + (v.skuId !== '0' ? v.skuId : '') + ':' + v.quantity);
                    });

                    $.extend(json, {
                        'info': info.join(';'),
                        'storeId': _this.reserveDate.storeInfo.localstoreId
                    });
                }

                lib.mtop.request({
                    api: api,
                    v: version,
                    data: json,
                    extParam: {}
                }, function (data) {
                    lib.mtop.request({
                        api: 'mtop.dd.reserve.order.detail',
                        v: '1.1',
                        data: {
                            orderNo: data.data.id
                        },
                        extParam: {}
                    }, function (data) {
                        //生成订单后，记录用户名和手机
                        dd.lib.localStorage.set('reserve_user_info', {
                            userName: json.userName,
                            userPhone: json.userPhone
                        });
                        _this.orderId = data.data.id;
                        _this.doPay(data.data);
                    }, function (data) {
                        dd.ui.toast(data);
                    });
                }, function (data) {
                    dd.ui.toast(data);
                });
            },
            doPay: function (data) {
                //快捷支付
                var _this = this,
                    cb,
                    success = function () {
                        $("#J_my_reserve").removeAttr("data-ddid");
                        $("#J_my").removeAttr("data-ddid");
                        dd.lib.ddState({
                            'push': {
                                'ddid': 'my_reserve_details/' + _this.orderId,
                                'obj': {
                                    'referer': 'my'
                                },
                                'multi': true
                            }
                        });
                    },
                    back = function () {
                        $("#J_my_reserve").removeAttr("data-ddid");
                        $("#J_my").removeAttr("data-ddid");
                        dd.lib.ddState({
                            'back': {
                                'ddid': 'my_reserve_details/' + _this.orderId,
                                'obj': {
                                    'referer': 'my'
                                },
                                'multi': true
                            }
                        });
                    };

                if (_this.async) {
                    return;
                }
                _this.async = true;
                if (bridge.supportFunc("tradePay")) {
                    bridge.push("tradePay", {
                        tradeNO: data.alipayOrderId
                    }, function (result) {
                        if (result.resultCode && parseInt(result.resultCode) == 9000) {
                            cb = success;
                        } else {
                            cb = back;
                            var msg = result.resultCode == '6001' ? '操作已取消' : '支付未成功';
                            dd.ui.toast(msg);
                        }
                        _this.async = false;
                        setTimeout(function () {
                            cb();
                        }, 1500);
                    });
                } else {
                    var type = 0,
                        contents = ["预订支付", "确定买单"],
                        title = contents[type] || "";
                    lib.mtop.request({
                        api: 'mtop.order.doPay',
                        v: '1.0',
                        data: {
                            'orderId': data.taobaoOrderId,
                            'payType': 0
                        }
                    }, function (data) {
                        if (data.data) {
                            if (data.data.canPay == 'true') {
                                dd.ui.alipay({
                                    'title': title,
                                    'alipayUrl': data.data.alipayUrl,
                                    'successFunc': success,
                                    'backFunc': back
                                });
                            }
                        }
                        dd.ui.toast.hide();
                        _this.async = false;
                    }, function (e) {
                        dd.ui.toast(e);
                        _this.async = false;
                    });
                }
            }
        }
    }

    dd.app.ReserveConfirm = function () {
        return new ReserveConfirm;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-预定-日期选择
 * 扫码访问 taobaocoupon://reserve
 */
(function($, window, dd) {
	var bridge = window.bridge;
	var reserve_shops_panel = $('#J_reserve_date'),
		tpl_reserve_date = $('#J_tpl_reserve_date'),
		tpl_reserve_date_item = $('#J_tpl_reserve_date_item');

	var History = window.History;

	function ReserveDate() {
		return {
			wrap: reserve_shops_panel,
			init: function(arg1, arg2) {
				var _this = this;

				_this.alt = History.getState().data.referer || 'reserve_shops';

				_this.dateObj = new Date();
				_this.reserveMD = arg1; //预订日
				_this.reserveMonth = parseInt(arg1.split('-')[0]); //预定月
				_this.reserveDate = parseInt(arg1.split('-')[1]); //预定日
				_this.reserveDays = parseInt(arg2); //可预订天数

				_this.tpl = [];

				_this.initHandler();
			},
			initHandler: function() {
				this._renderStatic();
				//this._renderDynamic();
			},
			/*setBeforePageIn: function(i, o) {
				var _this = this;
			},*/
			setAfterPageOut: function(){
				setTimeout(function(){
					dd.lib.memCache.removeValue('reserve_date_update');
				}, 0)
			},
			//静态模板
			_renderStatic: function() {
				var _this = this;
				var tpl = dd.ui.tmpl(tpl_reserve_date.html(), {'alt': _this.alt});
				_this.wrap.html(tpl);

				_this._initDateItem1();
			},
			//动态渲染
			/*_renderDynamic: function() {
				var _this = this;
			},*/
			_initDateItem1: function() {
				var year = this.dateObj.getFullYear(),
					month = this.dateObj.getMonth() + 1,
					date = this.dateObj.getDate(),
					title = year + '年' + (month.toString().length == 1 ? '0' : '') + month + '月',
					day1stPush = this._getDayOfWeek(year+'-'+month+'-1'), //当月1号周几
					mdays = this._geTMonthDays(month),
					inReserveMonth = true,
					monthDaysLeft = mdays-date+1, //剩余天数
					inReserveDays;//当月在预定周日内的天数

				//console.log(monthDaysLeft)
				if(monthDaysLeft >= this.reserveDays) {
					//当月天数足够
					inReserveDays = this.reserveDays
				}else{
					//当月天数不足 需要下个月补充
					inReserveDays = monthDaysLeft;

					this.inReserveDaysLeft = this.reserveDays - inReserveDays; //剩余的可s预定天数(下个月)
				}

				var maxdate = date+inReserveDays-1;

				

				//是否需要补空周的天数
				var dateReserveObj = {};
				for(var i=1;i<=mdays;i++) {
					dateReserveObj[i] = {
						'v': year+'-'+month+'-'+i+' 00:00:00' //2014-03-04 16:45:18
					}

					if(i>=date && i<=maxdate) {
						dateReserveObj[i]['canReserve'] = true;
						//是否预订日
						if((month == this.reserveMonth) && (i == this.reserveDate)) {
							dateReserveObj[i]['reserveDate'] = true
						}
					}

					if(i == date) {
						dateReserveObj[i]['today'] = true
					}

					if(i == (date+1)) {
						dateReserveObj[i]['tomorrow'] = true
					}

					if(i == (date+2)) {
						dateReserveObj[i]['afterTomorrow'] = true
					}
				}

				this._initDateTpl({
					'title': title,
					'day1stPush': day1stPush,
					'dateReserveObj': dateReserveObj
				});

                //改成默认渲染两个月的数据
                this._initDateItem2();
				/*if(this.inReserveDaysLeft) {
					this._initDateItem2();
				}else{
					this.startUp();
				}*/
				
				//console.log(dateReserveObj)
				

				/*console.log('month: ' + month + '\n' +
				 'date: ' + date + '\n' +
				 'title: ' + title + '\n' + 
				 'mdays: ' + mdays+'\n'+
				 'day1stPush: '+day1stPush+'\n'+
				 'inReserveDays: '+inReserveDays)*/
			},
			_initDateItem2: function(){
				var year = this.dateObj.getFullYear(),
					month = this.dateObj.getMonth() + 1,
					date = this.dateObj.getDate();

				if(month == 12) {
					month = 01;
					year++;
				}else{
					month++;
				}

				var title = year + '年' + (month.toString().length == 1 ? '0' : '') + month + '月',
					day1stPush = this._getDayOfWeek(year+'-'+month+'-1'), //当月1号周几
					mdays = this._geTMonthDays(month),
					inReserveMonth = false,
					inReserveDays = this.inReserveDaysLeft;


				var dateReserveObj = {};
				for(var i=1;i<=mdays;i++) {
					dateReserveObj[i] = {
						'v': year+'-'+month+'-'+i+' 00:00:00' //2014-03-04 16:45:18
					}

					if(i<=inReserveDays) {
						dateReserveObj[i]['canReserve'] = true;

						//是否预订日
						if((month == this.reserveMonth) && (i == this.reserveDate)) {
							dateReserveObj[i]['reserveDate'] = true
						}
					}
				}

				this._initDateTpl({
					'title': title,
					'day1stPush': day1stPush,
					'dateReserveObj': dateReserveObj
				});

				this.startUp();
			},
			//判断是否闰年
			_getLeapYear: function(year) {
				return (year % 4 === 0 ? true : false);
			},
			//判断大小月
			_geTMonthDays: function(month) {
				var _this = this;
				var days;
				switch (month.toString()) {
					case '1':
					case '3':
					case '5':
					case '7':
					case '8':
					case '10':
					case '12':
						{
							days = 31;
							break;
						}
					case '2':
						{
							if (_this._getLeapYear(_this.dateObj.getFullYear())) {
								days = 29;
							} else {
								days = 28;
							}
							break;
						}
					default:
						{
							days = 30;
							break;
						}
				}
				return days;
			},
			//获取某天周几
			_getDayOfWeek: function (dayValue) {
				var day = new Date(Date.parse(dayValue.replace(/-/g, '/'))); //将日期值格式化
				return day.getDay()
			},
			_initDateTpl: function(data) {
				//console.log(data)
				var tpl = dd.ui.tmpl(tpl_reserve_date_item.html(), data);

				this.tpl.push(tpl);
			},
			startUp: function() {
				$('#J_reserve_date_main').append(this.tpl.join(''));

				//this._iScrollInit();
			},
			events: [
				[dd.event.click, '.J_date_item', '_itemHandler']
			],
			_itemHandler: function(e, el){
				var _this = this,
					date = $(el).data('date');

				if(!$(el).hasClass('in')) {
					return
				}

				//dd.lib.memCache.set('reserve_date', date);
				dd.lib.memCache.set('reserve_date_update', date);

                var state_obj = {
                    'back': {
                        'ddid': _this.alt
                    }
                };
                dd.lib.ddState(state_obj);
			}
			//滚动初始化
			/*_iScrollInit: function() {
				var _this = this;
				_this.mainScroll && (_this.mainScroll.destroy() || (_this.mainScroll=null));

				_this.mainScroll = dd.ui.scroll({
					'view': _this,
					'wrap': '#J_reserve_reserve_date_scroll'
				});
			}*/
		}
	}

	dd.app.ReserveDate = function() {
		return new ReserveDate;
	};


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-预定-时间日期列表
 */
(function($, window, dd) {
	var reserve_datelist = $('#J_reserve_datelist'),
        tpl_reserve_datelist_content = $('#J_tpl_reserve_datelist_content'),
		tpl_reserve_datelist = $('#J_tpl_reserve_datelist'),
        tpl_reserve_datelist_seats = $('#J_tpl_reserve_datelist_seats');

    var bridge = window.bridge;

	function ReserveDatelist() {
		return {
			wrap: reserve_datelist,

            init: function(arg1, arg2) {
                var _this = this;

                _this.async = false;

                _this.role = 'refresh';

                //获取选项数据缓存
                _this.cacheMisc = dd.lib.memCache.get('reserve_shops_misc');

                _this.storeid = arg1;

                //如没有带入时间参数，则获取当天日期
                var d = new Date();
                _this.reserveDate = arg2 || d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' 00:00:00';

                _this.misc_data = _this.cacheMisc ? _this.cacheMisc.misc : undefined; //选项数据

                _this.capacity = _this.cacheMisc ? _this.cacheMisc.capacity : 0;

                _this.reserveRang = _this.cacheMisc ? _this.cacheMisc.reserveRang : 0;

                //_this.shops_filter_data = _this.shops_filter_data || _this._filterDataReset();
                _this.slide_config = {
                    'max': undefined, //数量
                    'unit': undefined //单个宽度
                };

                _this.initHandler();
            },

            initHandler: function(){
                this._renderStatic();
                this._renderDynamic();
            },

            setAfterPageIn: function(){
                var _this = this,
                    update_date = dd.lib.memCache.get('reserve_date_update'),
                    shops_misc = dd.lib.memCache.get('reserve_shops_misc');

                //来自日历更新
                if(update_date) {
                    _this.reserveDate = update_date;
                    _this.role = 'refresh';
                    _this._renderDynamic();
                }

                //如果时间/人数参数有变更，也需更新
                if(shops_misc && (shops_misc.capacity !== _this.capacity || shops_misc.reserveRang !== _this.reserveRang)){
                    _this.capacity = shops_misc.capacity;
                    _this.reserveRang = shops_misc.reserveRang;

                    _this.role = 'refresh';
                    _this._renderDynamic();
                }
            },

            //静态模板
            _renderStatic: function(){
                this.wrap.html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function(){
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_reserve_datelist.html(), {'alt': History.getState().data.referer || 'reserve_shops'});

                _this.wrap.html(tpl);

                //loading
                _this.reserve_datelist_content = this.wrap.find('#J_reserve_datelist_content').html(dd.ui.tpl.load);

                //是否记录过misc信息
                if(!_this.misc_data) {
                    _this._getMisc();
                }else{
                    _this._getSeatData();
                }
            },

            startUp: function(tpl) {
                this.reserve_datelist_seats.html(tpl);
            },


            events: [
                [dd.event.click, '#J_get_calendar', '_getCalendarHandler'],
                [dd.event.click, '.J_date_item', '_filterDateHandler'],
                ['change', 'select', '_filterSelectHandler'],
                [dd.event.click, '.J_Time', '_orderSeatHandler']
            ],

            //获取选项数据
            _getMisc: function(){
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.dd.reserve.reserveMisc',
                    v: '1.0',
                    data: {},
                    extParam: {}
                }, function(data) {
                    var _data = data.data;

                    if (_data) {
                        _this.misc_data = _data;

                        _this._getSeatData();
                    }
                }, function(data) {
                    dd.ui.toast(data, _this);
                });
            },

            //渲染筛选条件
            _buildFilterTpl: function(){
                var _this = this,
                    date_list = _this._getFilterDate();

                var unit = (document.body.clientWidth - 45)/3;

                var tpl = dd.ui.tmpl(tpl_reserve_datelist_content.html(), {
                    'data': _this.misc_data,
                    'date_list':date_list,
                    'capacity': _this.capacity,
                    'reserve_range': _this.reserveRang,
                    'width': unit
                });

                _this.reserve_datelist_content.html(tpl);

                _this.reserve_datelist_seats = _this.wrap.find('#J_reserve_datelist_seats').html(dd.ui.tpl.load);

                //滚动相关
                _this.reserve_filter_date_ul = _this.wrap.find('#J_reserve_filter_date_ul');
                _this.slide_config.max = _this.reserve_filter_date_ul.children().length;
                _this.slide_config.unit = unit;

                //选中当前日期
                var id = '#J_reserve_shops_date_' + _this.reserveDate.split(' ')[0];
                _this.wrap.find(id).addClass('current').siblings('.current').removeClass('current');
                _this._slideDate();
            },


            //获取预定数据
            _getSeatData: function(){
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.dd.reserve.auctionlist',
                    v: '1.1',
                    data: {
                        'localstoreId': _this.storeid,
                        'reserveDate': _this.reserveDate + ' 00:00:00',
                        'reserveRang': _this.reserveRang,
                        'capacity': _this.capacity
                    },
                    extParam: {}
                }, function(data) {
                    var _data = data.data;

                    _this.storeInfo = _data;
                    //可预定的时间段
                    _this.reserveDays = parseInt(_data.reserveDays);

                    $('#J_ShopName').html(_data.localstoreName);

                    //渲染店铺折扣信息
                    if(_data.discountInfo){
                        $('#J_ShopDiscount').show().html('<i></i>' + _data.discountInfo);
                    }

                    _this._buildFilterTpl();

                    _this._buildListTpl(_data);
                }, function(data) {
                    dd.ui.toast(data, _this);
                });
            },

            //渲染座位列表
            _buildListTpl: function(data){
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_reserve_datelist_seats.html(), {list: _this.organizeData(data)});

                if(this.role == 'refresh') {
                    this.reserve_datelist_seats.empty();
                }

                this.startUp(tpl);

                if(data.list.length == 0){
                    dd.ui.toast('今天的座位都被订完啦，看看其他时间的座位吧！')
                }

                /*
                if(!data.list.length){
                    return;
                }

                if(this.role == 'refresh') {
                    this._iScrollInit();
                }
                else{
                    this.mainScroll.refresh();
                }*/
            },

            //格式化时间数据
            organizeData: function(data){
                var new_list = data.list;
                $.each(new_list, function(index, item){
                    $.each(item.timelist, function(i, time){
                        var new_time = time.date.split(' ')[1],
                            temp = new_time.split(':');

                        time.formatDate = temp[0] + ":" + temp[1];
                    });
                });

                return new_list;
            },

            //日期点击
            _filterDateHandler: function(e, el){
                var $el = $(el),
                    ymd = $el.data('ymd');

                if(this.async || $el.hasClass('current')) return;

                this.reserveDate = ymd + ' 00:00:00';

                $el.addClass('current').siblings().removeClass('current');
                this._slideDate();
                //History.replaceState('','淘点点', '?_ddid=reserve_shops/'+ymd);
                this._filterHandler();
            },

            //下拉筛选
            _filterSelectHandler: function(e, el){
                var _this = this,
                    $el = $(el),
                    name = $el.data('name'),
                    v = el.value;

                if(v == -1) return;

                if(_this.async) return;

                var show_value = $el.siblings('.J_show_value'),
                    option_el = $el.children().not(function(){ return !this.selected }),
                    text = option_el.text();

                show_value.text(text);

                _this[name] = v;

                _this._filterHandler();
            },

            _filterHandler: function(){
                this.reserve_datelist_seats.html(dd.ui.tpl.load);
                //this._scrollReset();
                this.role = 'refresh';
                this._getSeatData();
            },

            /*_scrollReset: function(){
                this.pulldown_el.addClass('dn');
                this.pullup_el.addClass('dn');

                //this.mainScroll && (this.mainScroll.destroy() || (this.mainScroll=null));
                $('#J_reserve_datelist_scroll').children().attr('style','');
            },*/

            //日历选择
            _getCalendarHandler: function(){
                var _this = this;
                var current_item = _this.wrap.find('.J_date_item').filter('.current'),
                    current_date = current_item.data('date');

                dd.lib.ddState({
                    'push': {
                        'ddid': 'reserve_date/'+ current_date + '/' + _this.reserveDays,
                        'referer': 'reserve_datelist'
                    }
                });
            },
            _slideDate: function(){
                var current_el = this.reserve_filter_date_ul.find('.current'),
                    index = current_el.index(),
                    x;

                if(index == 0) {
                    x=0;
                }else if(index >= this.slide_config.max-1){
                    x = (index-2)*this.slide_config.unit;
                }else{
                    x = (index-1)*this.slide_config.unit;
                }

                this.reserve_filter_date_ul[0].style.webkitTransform = 'translate3d(-'+ x +'px, 0, 0)';
            },

            //点击时间点
            _orderSeatHandler: function(e, el){
                var _this = this, aim,
                    $el = $(el);

                if($el.hasClass('none')){
                    return;
                }

                var reserve_time = $el.attr('data-time'),
                    date = reserve_time.split(' '),
                    week = _this._getDayOfWeek(date[0]),
                    time = $el.find('span').html(),
                    index = $el.attr('data-index');


                dd.lib.localStorage.set('reserve_date', {
                    'seatType': $el.parents('div.list_item').find('h3').html(),
                    'displayDate': date[0] + ' ' + week + ' ' + time,
                    'reserveTime': reserve_time,
                    'storeInfo': _this.storeInfo,
                    'index': $el.attr('data-index')
                });

                //如有强制点菜，则转去点菜列表
                if($el.attr('data-require') == '1'){
                    aim = 'carte/dian/' +  _this.storeid + '/' + index + '/' + time;
                }

                dd.lib.ddState({
                    'push': {
                        'ddid': aim || 'reserve_confirm',
                        'obj': {
                            'referer': 'reserve_datelist/' + _this.storeid + '/' + _this.reserveDate
                        }
                    }
                });
            },

            //滚动初始化
            /*_iScrollInit: function(){
                var _this = this;
                _this.mainScroll && (_this.mainScroll.destroy() || (_this.mainScroll));

                _this.mainScroll = dd.ui.scroll({
                    'view': _this,
                    'wrap': '#J_reserve_datelist_scroll',
                    'pullDownAction': _this._pullDownAction
                });
            },*/

            /*_pullDownAction: function() {
                //刷新
                var _this = this;

                _this.role = 'refresh';
                _this._getSeatData('refresh');
            },*/

            _getFilterDate: function(){
                var _this = this;
                var d = new Date(),
                    todayObj = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' 00:00:00';

                var ymd = todayObj.split(' ')[0].split('-'),
                    yy = ymd[0],
                    mm = ymd[1],
                    dd = parseInt(ymd[2]);

                var m1st_days = _this._geTMonthDays(mm),
                    m1st_daysLeft = m1st_days-dd + 1, //剩余天数
                    inReserveDays,//当月在预定周日内的天数
                    inReserveDaysLeft;

                if(m1st_daysLeft >= _this.reserveDays) {
                    //当月天数足够
                    inReserveDays = _this.reserveDays
                }else{
                    //当月天数不足 需要下个月补充
                    inReserveDays = m1st_daysLeft;

                    inReserveDaysLeft = _this.reserveDays - inReserveDays; //剩余的可s预定天数(下个月)
                }
                var max_1st_date = dd + inReserveDays-1;

                var date_arr = [];
                for(var i=1; i <= m1st_days; i++) {
                    if(i>=dd && i<=max_1st_date) {
                        var _ymd = yy + '-' + mm + '-' + i,
                            tta = '';

                        if(i == dd) {
                            tta = '今天';
                        }

                        if(i == (dd+1)) {
                            tta = '明天';
                        }

                        if(i == (dd+2)) {
                            tta = '后天';
                        }
                        date_arr.push([mm+'-'+i,_ymd,_this._getDayOfWeek(_ymd),tta])
                    }
                }


                //下个月
                if(inReserveDaysLeft) {
                    if(mm == 12) {
                        mm = 01;
                        yy++;
                    }else{
                        mm++;
                    }
                }

                var m2st_days = _this._geTMonthDays(mm);
                for(var j=1; j <= m2st_days; j++) {
                    if(j<=inReserveDaysLeft) {
                        var _ymd2 = yy+'-'+mm+'-'+j;

                        date_arr.push([mm+'-' + j, _ymd2, _this._getDayOfWeek(_ymd2)])
                    }
                }
                return date_arr;
            },
            //判断大小月
            _geTMonthDays: function(month) {
                var _this = this;
                var days;
                switch (month.toString()) {
                    case '1':
                    case '3':
                    case '5':
                    case '7':
                    case '8':
                    case '10':
                    case '12':
                    {
                        days = 31;
                        break;
                    }
                    case '2':
                    {
                        if(_this.dateObj.getFullYear() % 4 === 0) {
                            days = 29;
                        } else {
                            days = 28;
                        }
                        break;
                    }
                    default:
                    {
                        days = 30;
                        break;
                    }
                }
                return days;
            },
            //获取某天周几
            _getDayOfWeek: function (dayValue) {
                var day = new Date(Date.parse(dayValue.replace(/-/g, '/'))); //将日期值格式化
                var week = ['周日','周一','周二','周三','周四','周五','周六'];
                return week[day.getDay()];
            }
		}
	}

	dd.app.ReserveDatelist = function() {
		return new ReserveDatelist;
	};


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-预定-店铺列表
 * 扫码访问 taobaocoupon://reserve
 */
(function($, window, dd) {
	var bridge = window.bridge;
	var doc = window.document,
		body = doc.body;
	var reserve_shops_panel = $('#J_reserve_shops'),
		tpl_reserve_shops = $('#J_tpl_reserve_shops'),
		tpl_reserve_shops_content = $('#J_tpl_reserve_shops_content'),
		tpl_reserve_shops_list = $('#J_tpl_reserve_shops_list');

	var History = window.History;

	function ReserveShops() {
		return {
			wrap: reserve_shops_panel,
			init: function(arg1) {
				var _this = this;

				_this.async = false;

				_this.role = 'refresh';

				_this.misc_data = undefined; //选项数据

				var d = new Date();
				_this.todayObj = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' 00:00:00';

				_this.shops_filter_data = _this.shops_filter_data || _this._filterDataReset();

				_this.slide_config = {
					'max': undefined, //数量
					'unit': undefined //单个宽度
				}

				_this.initHandler();
			},
			initHandler: function(){
				this._renderStatic();
				this._renderDynamic();
			},
			setBeforePageOut: function(i, o){/*
				if(!/index/.test(i)) {
					this.scroll_top = doc.body.scrollTop;
				}
				doc.body.scrollTop = 0;*/
			},
			setAfterPageOut: function(i,o){
				//this.winScroll && this.winScroll.loadDisable();
			},
			setAfterPageIn: function(i,o){
				//来自日历更新
				if(dd.lib.memCache.get('reserve_date_update')) {
					var d = dd.lib.memCache.get('reserve_date_update')
					this.shops_filter_data.reserveDate = d;
					this.role = 'refresh';
					this._cityInit();
				}

				//来自城市更新
				if(dd.lib.memCache.get('update_city')) {
					this._cityInit();
				}
			},
			//静态模板
			_renderStatic: function(){
				var _this = this;
				_this.wrap.html(dd.ui.tpl.load);
			},
			//动态渲染
			_renderDynamic: function(){
				var _this = this;

				//没有定位过
				if(!dd.lib.localStorage.get('current_city')){
					body.addEventListener('click', dd.lib.preventAllClick, true);
					dd.lib.getH5Geo({
						'callback': function(g_pos){
							body.removeEventListener('click', dd.lib.preventAllClick, true);
							if(g_pos.latitude) {
								_this._cityInit();
							}else{
								_this.wrap.html(dd.ui.tpl.load)
								dd.ui.toast('无法定位，请检查“定位”设置<br>',_this);
								dd.lib.ddState({
									'push': {
										'ddid': 'city',
										'obj': {
											'referer': 'reserve_shops'
										}
									}
								});
							}
							
						}
					});
					return
				}

				_this._cityInit();
			},
			_cityInit: function(){
				var _this = this;
				var current_city = dd.lib.localStorage.get('current_city');

				_this.shops_filter_data.city = current_city.cityId;
				_this.shops_filter_data.posY = current_city.latitude;
				_this.shops_filter_data.posX = current_city.longitude;
				//console.log(current_city)

				//渲染框架
				_this._renderFrame(current_city);
			},
			_renderFrame: function(current_city){
				var tpl = dd.ui.tmpl(tpl_reserve_shops.html(), current_city);
				this.wrap.html(tpl);

				//loading
				this.reserve_shops_content = this.wrap.find('#J_reserve_shops_content').html(dd.ui.tpl.load);

				//是否记录过misc信息
				if(!this.misc_data) {
					this._getMisc()
				}else{
					this._buildFilterTpl();
				}
				
			},
			_filterDataReset: function(){
				return {
					"reserveRang":"0", //时限
					"posY":"", //纬度
					"posX":"", //经度
					"pageNo":1, //页码
					"pageSize":20, //每页条数
					"capacity":"0", //人数
					"reserveDate": this.todayObj, //时间 2014-03-03 20:21:49
					"city":"", //城市
					'pageTotal': undefined //总页数
				}
			},
			//获取选项数据
			_getMisc: function(){
				var _this = this;
				lib.mtop.request({
					api: 'mtop.dd.reserve.reserveMisc',
					v: '1.0',
					data: {},
					extParam: {}
				}, function(data) {
					var _data = data.data;
					if (_data) {
						_this.misc_data = _data;
						_this.reserveDays = _data.reserveDays;
						_this._buildFilterTpl();
					}
				}, function(data) {
					dd.ui.toast(data, _this);
				});
			},
			_buildFilterTpl: function(){

				var date_list = this._getFilterDate(this.misc_data);

				var unit = (document.body.clientWidth - 45)/3;

				var tpl = dd.ui.tmpl(tpl_reserve_shops_content.html(), {
					'data': this.misc_data,
					'date_list':date_list,
					'width': unit
				});
				this.reserve_shops_content.html(tpl);

				this.reserve_shops_list = this.wrap.find('#J_reserve_shops_list').html(dd.ui.tpl.load);

				//滚动相关
				this.reserve_filter_date_ul = this.wrap.find('#J_reserve_filter_date_ul');
				this.slide_config.max = this.reserve_filter_date_ul.children().length;
				this.slide_config.unit = unit;

				//选中当前日期
				var id = '#J_reserve_shops_date_'+this.shops_filter_data.reserveDate.split(' ')[0];
				this.wrap.find(id).addClass('current').siblings('.current').removeClass('current');
				this._slideDate();

				this.pulldown_el = this.wrap.find('.J_pulldown'),
				this.pullup_el = this.wrap.find('.J_pullUp');

				this._getStoreList()
			},
			//获取列表数据
			_getStoreList: function(){
				var _this = this;

				if(_this.async) {
					return;
				}
				_this.async = true;

				//页码重置
				if(_this.role == 'refresh') {
					_this.shops_filter_data.pageNo = 1;
				}

				lib.mtop.request({
					api: 'mtop.dd.reserve.storelist',
					v: '1.0',
					data: {
						"reserveRang": _this.shops_filter_data.reserveRang,
						"posY": _this.shops_filter_data.posY,
						"posX": _this.shops_filter_data.posX,
						"pageNo": _this.shops_filter_data.pageNo,
						"pageSize": _this.shops_filter_data.pageSize,
						"capacity": _this.shops_filter_data.capacity,
						"reserveDate": _this.shops_filter_data.reserveDate,
						"city": _this.shops_filter_data.city
					},
					extParam: {}
				}, function(data) {
					var _data = data.data;
					_this.async = false;
					if (_data) {
						_this.shops_filter_data.pageTotal = Math.ceil(parseInt(_data.total)/_this.shops_filter_data.pageSize);
						_this._buildListTpl(_data)
					}
				}, function(data) {
					dd.ui.toast(data, _this)
					_this.async = false;
					if(_this.role !== 'refresh') {
						_this.shops_filter_data.pageNo--;
					}
				});
			},
			_buildListTpl: function(data){
				//console.log(data)
				var tpl = dd.ui.tmpl(tpl_reserve_shops_list.html(), data);

				if(this.role == 'refresh') {
					this.reserve_shops_list.empty();
				}

				this.startUp(tpl);

				if(this.role == 'refresh') {
					//是否翻页
					if(this.shops_filter_data.pageTotal > 1) {
						this.pullup_el.removeClass('dn');
					}else{
						this.pullup_el.addClass('dn');
					}

					this._scrollInit();
				}else{
					//是否最后页
					if(this.shops_filter_data.pageNo >= this.shops_filter_data.pageTotal) {
						this.pullup_el.addClass('dn');
					}

					this._scroll.refresh();
				}
				
				
			},
			startUp: function(tpl) {
				this.reserve_shops_list.append(tpl);
            },
            events: [
            	[dd.event.click, '.J_get_calendar', '_getCalendarHandler'],
            	[dd.event.click, '.J_date_item', '_filterDateHandler'],
            	['change', 'select', '_filterSelectHandler'],
            	[dd.event.click, '.J_date_shop_item', '_shopItemHandler']
            ],
            //日期点击
            _filterDateHandler: function(e, el){
            	var $el = $(el),
            		ymd = $el.data('ymd');

            	if(this.async || $el.hasClass('current')) return

            	this.shops_filter_data.reserveDate = ymd+' 00:00:00';

            	$el.addClass('current').siblings().removeClass('current');
            	this._slideDate();
            	//History.replaceState('','淘点点', '?_ddid=reserve_shops/'+ymd);
            	this._filterHandler();
            },
            //下拉筛选
            _filterSelectHandler: function(e, el){
            	var $el = $(el),
            		name = $el.data('name'),
            		v = el.value;

            	if(this.async) return;

            	var show_value = $el.siblings('.J_show_value'),
            		option_el = $el.children().not(function(){ return !this.selected }),
            		text = option_el.text();

                show_value.text(text);

            	this.shops_filter_data[name] = v;



            	this._filterHandler();
            },
            _filterHandler: function(){
            	this.reserve_shops_list.html(dd.ui.tpl.load);
            	this._scrollReset();
            	this.role = 'refresh';
            	this._getStoreList();
            },
            _scrollReset: function(){
            	this.pulldown_el.addClass('dn')
            	this.pullup_el.addClass('dn')

            	//this.mainScroll && (this.mainScroll.destroy() || (this.mainScroll=null));
            	$('#J_tpl_reserve_shops_scroll').children().attr('style','');
            },
            //日历选择
            _getCalendarHandler: function(){
            	var _this = this;
            	var current_item = _this.wrap.find('.J_date_item').filter('.current'),
            		current_date = current_item.data('date');

            	dd.lib.ddState({
            		'push': {
            			'ddid': 'reserve_date/'+current_date+'/'+ _this.reserveDays,
            			'referer': 'reserve_shops'
            		}
            	})
            },
            _slideDate: function(index){
            	var current_el = this.reserve_filter_date_ul.find('.current'),
            		index = current_el.index(),
            		x;

            	if(index == 0) {
            		x=0;
            	}else if(index >= this.slide_config.max-1){
            		x = (index-2)*this.slide_config.unit;
            	}else{
            		x = (index-1)*this.slide_config.unit;
            	}

            	this.reserve_filter_date_ul[0].style.webkitTransform = 'translate3d(-'+ x +'px, 0, 0)';
            },
            //点击店铺
            _shopItemHandler: function(e, el){
            	var $el = $(el),
            		ymd = this.reserve_filter_date_ul.find('.current').data('ymd');

            	//存储预定杂项选项数据
            	dd.lib.memCache.set('reserve_shops_misc', {
                    'misc': this.misc_data,
                    'capacity': this.shops_filter_data.capacity,
                    'reserveRang': this.shops_filter_data.reserveRang
                });

            	dd.lib.ddState({
            		'push': {
            			'ddid': 'reserve_datelist/'+$el.data('id')+'/'+ymd,
            			'obj': {
            				'referer': 'reserve_shops'
            			}
            		}
            	});
            },
			//滚动初始化
			_scrollInit: function(){
				var _this = this;
				this._scroll = dd.ui._scroll({
					'wrap': '#J_tpl_reserve_shops_scroll',
					'pullUpAction': function(){
						_this._pullUpAction()
					}
				})
			},
			_pullDownAction: function() {
				//刷新
				var _this = this;

				_this.role = 'refresh';
				_this._getStoreList('refresh');
			},
			_pullUpAction: function(){
				//更多
				var _this = this;

				_this.shops_filter_data.pageNo++;

				_this.role = 'add';
				_this._getStoreList('add');
			},
			_getFilterDate: function(){
				var _this = this;

				var ymd = _this.todayObj.split(' ')[0].split('-'),
					yy = ymd[0],
					mm = ymd[1],
					dd = parseInt(ymd[2]);

				var m1st_days = _this._geTMonthDays(mm),
					m1st_daysLeft = m1st_days-dd+1, //剩余天数
					inReserveDays,//当月在预定周日内的天数
					inReserveDaysLeft;

				//console.log(monthDaysLeft)
				if(m1st_daysLeft >= this.reserveDays) {
					//当月天数足够
					inReserveDays = this.reserveDays
				}else{
					//当月天数不足 需要下个月补充
					inReserveDays = m1st_daysLeft;

					inReserveDaysLeft = this.reserveDays - inReserveDays; //剩余的可s预定天数(下个月)
				}

				var max_1st_date = dd+inReserveDays-1;


				var date_arr = [];
				for(var i=1;i<=m1st_days;i++) {
					if(i>=dd && i<=max_1st_date) {
						var _ymd = yy+'-'+mm+'-'+i,tta='';

						if(i == dd) {
							tta = '今天';
						}

						if(i == (dd+1)) {
							tta = '明天';
						}

						if(i == (dd+2)) {
							tta = '后天';
						}
						date_arr.push([mm+'-'+i,_ymd,_this._getDayOfWeek(_ymd),tta])
					}
				}


				//下个月
				if(inReserveDaysLeft) {
					if(mm == 12) {
						mm = 01;
						yy++;
					}else{
						mm++;
					}
				}

				var m2st_days = _this._geTMonthDays(mm);

				for(var i=1;i<=m2st_days;i++) {
					if(i<=inReserveDaysLeft) {
						var _ymd = yy+'-'+mm+'-'+i,tta='';
						date_arr.push([mm+'-'+i, _ymd,_this._getDayOfWeek(_ymd)])
					}
				}

				
				return date_arr

				/*console.log(m1st_days+' '+m1st_daysLeft+' '+inReserveDays+' '+inReserveDaysLeft)
				console.log(arr)*/
				//console.log(_this.todayObj)
			},
			//判断大小月
			_geTMonthDays: function(month) {
				var _this = this;
				var days;
				switch (month.toString()) {
					case '1':
					case '3':
					case '5':
					case '7':
					case '8':
					case '10':
					case '12':
						{
							days = 31;
							break;
						}
					case '2':
						{
							if(_this.dateObj.getFullYear() % 4 === 0) {
								days = 29;
							} else {
								days = 28;
							}
							break;
						}
					default:
						{
							days = 30;
							break;
						}
				}
				return days;
			},
			//获取某天周几
			_getDayOfWeek: function (dayValue) {
				var day = new Date(Date.parse(dayValue.replace(/-/g, '/'))); //将日期值格式化
				var week = ['周日','周一','周二','周三','周四','周五','周六'];
				return week[day.getDay()];
			}
		}
	}

	dd.app.ReserveShops = function() {
		return new ReserveShops;
	};


})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-评价（我的点菜、外卖、支付）
 */
(function ($, window, dd) {
    var bridge = window.bridge;

    var History = window.History;

    function Review() {
        return {
            wrap: $('#J_review'),

            tpl: $('#J_tpl_review'),

            init: function (arg1) {
                var self = this;
                self.id = arg1;

                self.historyData = History.getState().data;

                self.swipeid = self.historyData.referer;

                //loadding
                self.wrap.html(dd.ui.tpl.load);

                //点菜/支付 评价直接获取页面缓存数据
                if(self.historyData.orderData){
                    self.render(self.historyData.orderData);
                }else{
                    //获取外卖订单数据
                    self._getOrderData();
                }

                $(document).on('tplDomRenderEnd', function () {
                    if (dd._hideTitleBar) {
                        bridge.push("setTitle", {
                            title: self.wrap.find(".hd_title").find("h2").html() || "淘点点"
                        });
                    }
                })
            },

            events: [
                [dd.event.click, '#J_reviewSubmit', '_submitReview'],
                [dd.event.click, '.J_swipe_page_noreturn', '_quitConfirm']
            ],

            _submitReview: function(){
                var self = this,
                    json = {},
                    para_array = $('#J_ReviewForm').serializeArray();

                para_array.forEach(function (obj) {
                    json[obj.name] = obj.value;
                });

                self.sendRequest(json);
            },

            sendRequest: function(json){
                var self = this,
                    param, ddid, order_data,
                    praise_array = [],
                    praise = self.wrap.find('.J_praise');

                if(self.swipeid == 'my_delivery'){
                    $.each(praise, function(i, item){
                        if(item.checked){
                            praise_array.push(parseInt(item.name));
                        }
                    });

                    //后端参数设置问题，没内容的时候需传个字符串，先这么hack
                    if(praise_array.length == 0){
                        praise_array = '[]';
                    }else{
                        praise_array = '[' + praise_array.join(',') + ']';
                    }

                    param = {
                        api: 'mtop.takeout.comment.saveCommentAndDigg',
                        v: '1.0',
                        data: $.extend(json, {
                            'orderId': self.id,
                            'shopId': self.data.shopId,
                            'diggItemIds': praise_array
                        })
                    };

                    ddid = self.swipeid;
                }
                else if (self.swipeid == 'my_order_details'){
                    order_data = self.historyData.orderData;

                    $.each(praise, function(i, item){
                        var isDigg = item.checked ? '1' : '0';
                        //itemId, skuId, itemPic, isDigg 多条以分号分隔,skuId和itemPic暂不传
                        praise_array.push(item.name + ',,,' + isDigg);
                    });

                    param = {
                        api: 'mtop.life.diandian.publishReview',
                        v: '2.0',
                        data: {
                            'starScore': json.taste,
                            'content': json.content,
                            'localstoreId': order_data.storeInfo.storeId,
                            'serveOrderId': order_data.orderId,
                            'a': 9,
                            'p': 1,
                            'itemUgcs': praise_array.join(';')
                        }
                    };

                    ddid = 'my_order';
                }

                else if(self.swipeid == 'my_pay' || self.swipeid == 'pay_result'){
                    order_data = self.historyData.orderData;

                    param = {
                        api: 'mtop.dd.review.add',
                        v: '1.0',
                        data: {
                            "content": json.content,
                            "orderNo": order_data.orderNo,
                            "feed": json.taste,
                            "localstoreId": order_data.localstoreId
                        }
                    };

                    ddid = 'my_pay';
                }

                lib.mtop.request(param, function (data) {
                    dd.lib.ddState({
                        'replace': {
                            'ddid': ddid
                        }
                    });

                }, function (data) {
                    dd.ui.toast(data);
                });
            },


            _quitConfirm: function(e, el){
                if($(el).data('role') == 'back' && $('#J_ReviewContent').val() !== ''){
                    bridge.push('confirm', {
                        message: '真的要放弃评价吗？',
                        okButton: '确定',
                        cancelButton: '取消'
                    }, function (result) {
                        if (result.ok) {
                            dd.navi.back = true;
                            dd.lib.ddState({
                                back: {
                                    'ddid': '',
                                    'multi': ''
                                }
                            })
                        }
                    });
                }
                else {
                    dd.navi.back = true;
                    dd.lib.ddState({
                        back: {
                            'ddid': '',
                            'multi': ''
                        }
                    })
                }
            },


            render: function(data){
                var self = this;

                self._buildTmpl(self._mixData(data));

                //触发渲染后的操作
                $(document).trigger('tplDomRenderEnd');
            },


            _getOrderData: function () {
                var self = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.getTcOrderDetail',
                    v: '1.0',
                    data: {
                        'oid': self.id
                    }
                }, function (data) {
                    if (data.data) {
                        self.render(data.data);
                    }
                }, function (data) {
                    dd.ui.toast(data, self);
                });
            },


            _mixData: function (data) {
                var self = this,
                    time = data.time || data.createTime;

                //增加下单时间数据
                var d = new Date(parseInt(time));
                var formatTime = d.getFullYear() + '-' 
                               + (d.getMonth() + 1) + '-'
                               + d.getDate() + '\t'
                               + d.getHours() + ':'
                               + (d.getMinutes()<10?'0' + d.getMinutes():d.getMinutes()) + ':'
                               + (d.getSeconds()<10?'0' + d.getSeconds():d.getSeconds());

                self.data = data;

                if((self.swipeid == 'my_pay' || self.swipeid == 'pay_result') &&  data.gmtCreate){
                    self.data.formatTime = data.gmtCreate;
                }else{
                    self.data.formatTime = formatTime;
                }

                return self.data;
            },

            _buildTmpl: function (data) {
                var self = this;
                var tpl = dd.ui.tmpl(self.tpl.html(), {'data': data, 'swipeid': self.swipeid});

                self.wrap.html(tpl);
            }
        }
    }

    dd.app.Review = function () {
        return new Review;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-店铺详情
 */
(function($, window, dd) {
    var bridge = window.bridge;
    var reviewlist_panel = $('#J_reviewlist'),
        tpl_reviewlist = $('#J_tpl_reviewlist'),
        tpl_reviewlist_list = $('#J_tpl_reviewlist_list');

    var History = window.History;

    function ReviewList() {
        return {
            wrap: reviewlist_panel,
            init: function(arg1, arg2) {
                var _this = this;

                _this.type = arg1; //store本地商户 shop外卖店铺
                if (_this.type == 'store') {
                    _this.storeid = arg2;
                } else if (_this.type == 'shop') {
                    _this.shopid = arg2;
                }

                _this.page = {
                    'store': {
                        'role': 'refresh', //刷新 或 翻页
                        'page_size': 10, //每页条数
                        'page_num': 1, //当前页
                        'total': 0, //订单总数
                        'pTotal': 1 //总页数
                    },
                    'shop': {
                        'role': 'refresh', //刷新 或 翻页
                        'page_size': 10, //每页条数
                        'page_num': 1, //当前页
                        'total': 0, //订单总数
                        'pTotal': 1 //总页数
                    }
                }

                _this.initHandler();
            },
            initHandler: function() {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function() {},
            setAfterPageOut: function() {},
            //静态模板
            _renderStatic: function() {
                var _this = this;

                var options = {
                    'alt': History.getState().data.referer || _this.type + '/' + _this.storeid || _this.shopid
                }

                var tpl = dd.ui.tmpl(tpl_reviewlist.html(), options);
                reviewlist_panel.html(tpl);

                _this.pullup_el = reviewlist_panel.find('.J_pullUp');

                _this.reviewlist_content = reviewlist_panel.find('#J_reviewlist_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function() {
                var _this = this;

                if (_this.type == 'store') {
                    _this._getStoreReviewList();
                } else if (_this.type == 'shop') {
                    _this._getShopReviewList();
                }
            },
            // 到店评论
            _getStoreReviewList: function() {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.getReviewList',
                    v: '1.0',
                    data: {
                        'page_size': _this.page.store.page_size,
                        'localstore_id': _this.storeid,
                        'page_num': _this.page.store.page_num
                    },
                    extParam: {}
                }, function(data) {
                    var _data = data.data;
                    if (_data) {
                        _this.page.store['total'] = parseInt(_data.reviewCount);
                        _this.page.store['pTotal'] = Math.ceil(parseInt(_data.reviewCount) / _this.page.store.page_size);

                        _this._buildTmpl(data.data);
                    }
                }, function(data) {
                    dd.ui.toast(data, _this);
                    if (_this.type == 'store') {
                        if (_this.page.store.role == 'add') {
                            _this.page.store.page_num--;
                        }
                    }
                });
            },
            // 外卖评论
            _getShopReviewList: function() {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.takeout.comment.queryCommentForPage',
                    v: '1.0',
                    data: {
                        'pageSize': _this.page.shop.page_size,
                        'shopId': _this.shopid,
                        'pageNo': _this.page.shop.page_num
                    },
                    extParam: {}
                }, function(data) {
                    var _data = data.data;
                    console.log(_data);
                    if (_data) {
                        _this.page.shop['total'] = parseInt(_data.totalCount);
                        _this.page.shop['pTotal'] = parseInt(_data.totalPage);

                        _this._buildTmpl(data.data);
                    }
                }, function(data) {
                    dd.ui.toast(data, _this);
                    if (_this.type == 'shop') {
                        if (_this.page.shop.role == 'add') {
                            _this.page.shop.page_num--;
                        }
                    }
                });
            },
            _buildTmpl: function(data) {
                var _this = this; //console.log(data);

                //刷新前清空
                if (_this.page[_this.type].role == 'refresh') {
                    _this.reviewlist_content.html('');

                    //重置当前页码
                    _this.page[_this.type].page_num = 1;
                }

                var options = {
                    storedata: _this.type == 'store' ? data : '',
                    shopdata: _this.type == 'shop' ? data : ''
                }

                var tpl = dd.ui.tmpl(tpl_reviewlist_list.html(), options);
                this.reviewlist_content.append(tpl);

                //判断是否有翻页
                var page_obj = _this.page[_this.type];
                if (page_obj['pTotal'] > 1 && page_obj['page_num'] < page_obj['pTotal']) {
                    _this.pullup_el.removeClass('dn');
                } else {
                    _this.pullup_el.addClass('dn');
                }

                if (_this.page[_this.type].role == 'refresh') {
                    _this._scrollInit();
                } else {
                    _this._scroll.refresh();
                }
            },
            //滚动初始化
            _scrollInit: function() {
                var _this = this;

                this._scroll = dd.ui._scroll({
                    'wrap': '#J_reviewlist_scroll',
                    'pullUpAction': function() {
                        _this._pullUpAction()
                    }
                })
            },
            _pullUpAction: function() {
                //加载
                var _this = this;

                _this.page[_this.type].page_num++;
                _this.page[_this.type].role = 'add';
                console.log(_this)

                if (_this.type == 'store') {
                    _this._getStoreReviewList();
                } else if (_this.type == 'shop') {
                    _this._getShopReviewList();
                }
            }
        }
    }

    dd.app.ReviewList = function() {
        return new ReviewList;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-搜索:首页，点菜外卖列表
 */
(function($, window, dd){
	var bridge = window.bridge;
	var search_panel = $('#J_search'),
		tpl_search = $('#J_tpl_search'),
		tpl_search_list = $('#J_tpl_search_list');

	//缓存
	dd.lib.memCache.set('search_cache', {})
	var searchCache = dd.lib.memCache.get('search_cache');

	var History = window.History;
	function Search() {
		return {
			wrap: search_panel,
			init: function(arg1) {
				var _this = this;

				_this.type = arg1; //类型：index-首页 delivery-外卖

				_this.referer = History.getState().data.referer; //来源

				_this.page = undefined; //当前page
				_this.inputEl = undefined; //输入框
				_this.inputWrap = undefined; //搜索框容器
				_this.searchUl = undefined; //列表容器
				_this.state = History.getState();

				_this.page = {
					index: {
						'p': 1, //当前页
						'pz': 20, //每页条数
						'kw': '', //关键词
						'total': 0, //商户总数
						'pageTotal':1 //总页数
					},
					dian: {
						'p': 1, //当前页
						'pz': 20, //每页条数
						'kw': '', //关键词
						'total': 0, //商户总数
						'pageTotal':1 //总页数
					},
					delivery: {
						'p': 1, //当前页
						'pz': 20, //每页条数
						'kw': '', //关键词
						'total': 0, //商户总数
						'pageTotal':1 //总页数
					},
					nearby: {
						'p': 1, //当前页
						'pz': 20, //每页条数
						'kw': '', //关键词
						'total': 0, //商户总数
						'pageTotal':1 //总页数
					}
				}

				//首页
				if(_this.type == 'index') {
					_this.indexData = dd.lib.memCache.get('index_search_data') || {}; //_this.state.data.indexData
					_this.page.index.kw = _this.indexData.kw
				}

				//点菜
				if(_this.type == 'dian') {
					_this.dianData = dd.lib.memCache.get('dian_filter_data') || {};
					_this.page.dian.kw = _this.dianData.kw;
				}

				//外卖
				if(_this.type == 'delivery') {
					_this.deliveryData = dd.lib.memCache.get('delivery_filter_data') || {};
					_this.default_address = dd.lib.localStorage.get('default_address')
 || {};
					_this.page.delivery.kw = _this.deliveryData.key;
				}

				//附近
				if(_this.type == 'nearby') {
					_this.nearbyData = dd.lib.memCache.get('nearby_filter_data') || {};
					_this.page.nearby.kw = _this.nearbyData.kw;
				}
				_this.initHandler();
			},
			
			initHandler: function() {
				this.startUp();
			},
			setAfterPageIn: function(){
				var _this = this;
				$(window).on('resize.search', function(){
					_this._scroll && _this._scroll.refresh();
				});
				
				//_this.inputEl.focus();
			},
			setAfterPageOut: function(i,o){
				var _this = this;
				$(window).off('resize.search');
				dd.lib.memCache.removeValue('update_nearby_index');

				//初始化首页搜索key
				if(i=='index') {
					_this.indexData.kw = '';
					dd.lib.memCache.set('index_search_data', _this.indexData);
				}
			},
			setBeforePageOut: function(){
				document.activeElement.blur();
			},
			startUp: function() {
				var _this = this;
				var tpl = dd.ui.tmpl(tpl_search.html(), {'key': _this.page[_this.type].kw});

				dd.ui.toast.hide();
				search_panel.html(tpl);

				_this.inputEl = search_panel.find('#J_search_input');
				_this.searchUl = search_panel.find('#J_search_list');

				dd.ui.toast.hide();

				//显示搜索列表
				if(_this.page[_this.type].kw) {
					_this._fireSearch(_this.page[_this.type].kw);
				}
			},
			events: [
				['input', '#J_search_input', '_inputHandler'],
				[dd.event.click, '#J_search_cancl', '_canclHandler'],
				[dd.event.click, '#J_search_sub', '_subHandler']
			],
			//输入监听
			_inputHandler: function(e,el){
				var _this = this;
				var v = $.trim(el.value.replace(/<|>/g,'')); //xss

				if(!v) {
					//清空
					_this.searchUl.empty();
					_this.pullup_el.addClass('dn');

					if(_this.type == 'index') {
						_this.indexData.kw = ''
					}

					if(_this.type == 'dian') {
						_this.dianData.kw = '';
					}

					if(_this.type == 'delivery') {
						_this.deliveryData.key = '';
					}

					if(_this.type == 'nearby') {
						_this.nearbyData.kw = '';
					}

					_this.page[_this.type].kw = el.value; //关键词
					_this._scroll && (_this._scroll = null);
					search_panel.find('.list_wrap').attr('style', '')
					return;
				}

				if(v !== _this.page[_this.type].kw) {
					_this._fireSearch(v)
				}
			},
			//取消
			_canclHandler: function(){
				var _this = this;
				if(_this.type == 'index') {
					_this._switchIndex();
				}else if(_this.type == 'dian'){
					//点菜
					_this.dianData.kw = '';
					_this._switchDian();
				}else if(_this.type == 'delivery'){
					//外卖
					_this.deliveryData.key = '';
					_this._switchDelivery();
				}else if(_this.type == 'nearby'){
					//点菜
					_this.nearbyData.kw = '';
					_this._switchNearby();
				}

				//搜索重置
				$('#J_search').removeAttr('data-ddid').empty();

				if(_this._scroll){
					//_this.mainScroll.destroy();
					_this._scroll = null;
				}
			},
			//确定
			_subHandler: function(){
				var _this = this;

				if(_this.type == 'index') {
					_this._switchIndexNearby();
				}else if(_this.type == 'delivery'){
					_this._switchDelivery();
				}else if(_this.type == 'dian'){
					_this._switchDian();
				}else if(_this.type == 'nearby'){
					_this._switchNearby();
				}
			},
			_fireSearch: function(v){
				var _this = this;
				_this.page[_this.type].p = 1; //重置当前页
				_this.page[_this.type].kw = v; //关键词

				_this.searchUl.html(dd.ui.tpl.load);

				if(_this.type == 'index') {
					//_this.page.index.p = 1; //重置当前页
					//_this.page.index.kw = this.value; //关键词
					_this._getIndexStoreList('init');
				}

				if(_this.type == 'dian') {
					//_this.page.dian.p = 1; //重置当前页
					//_this.page.dian.kw = this.value; //关键词
					_this._getDianStoreList('init');
				}

				if(_this.type == 'delivery') {
					//_this.page.delivery.p = 1; //重置当前页
					//_this.page.delivery.kw = this.value; //关键词
					_this._getTakeoutStoreList('init');
				}

				if(_this.type == 'nearby') {
					//_this.page.nearby.p = 1; //重置当前页
					//_this.page.nearby.kw = this.value; //关键词
					_this._getNearbyStoreList('init');
				}

				
			},
			//首页数据
			_getIndexStoreList: function(role){
				var _this = this;
				if(!_this.indexData.city_data) {
					dd.ui.toast('请回首页选择城市');
					return
				}

				var k = _this.type+'_'+_this.indexData.city_data.cityId+'_'+_this.page.index.kw+'_'+_this.page.index.p;
				var cached_data = searchCache[k];
				if(cached_data) {
					_this.indexData.kw = _this.page.index.kw;
					_this._buildList({storeList: cached_data.storeDList}, role);
					return;
				}

				if(_this.async) return;
				_this.async = true;

				dd.ui.toast.loading();
				lib.mtop.request({
					api: 'mtop.life.diandian.getStoreList',
					v: '1.1',
					data: {
						'p': _this.page.index.p,
						'ibf': 0,
						'city':_this.indexData.city_data.cityId,
						'kw': _this.page.index.kw,
						'pz': _this.page.index.pz,
						'f':'1,128,2048,4096,8192',
						'o':'wfzb'
					},
					extParam: {}
				}, function(data) {
					var _data = data.data;

					if(_data) {
						_this.page.index['total'] = _data.count;
						_this.page.index['pageTotal'] = Math.ceil(parseInt(_data.count)/_this.page.index.pz);

						_this._buildList({storeList: _data.storeDList}, role);

						_this.indexData.kw = _this.page.index.kw;

						searchCache[k] = _data;
					}
					_this.async = false;
					dd.ui.toast.hide();
				}, function(data) {
					_this.async = false;
					dd.ui.toast(data);
				});
			},
			//点菜
			_getDianStoreList: function(role){
				var _this = this;

				var k = _this.type+'_'+_this.dianData.city+'_'+_this.dianData.x+'_'+_this.dianData.y+'_'+_this.page.dian.kw+'_'+_this.dianData.o+'_'+_this.page.dian.p+'_'+_this.dianData.f+'_'+_this.dianData.cat;
				var cached_data = searchCache[k];
				if(cached_data) {
					_this.dianData.kw = _this.page.dian.kw;
					_this._buildList({storeList: cached_data.storeDList}, role);
					return;
				}

				if(_this.async) return;
				_this.async = true;

				//dd.ui.toast.loading();
				lib.mtop.request({
					api: 'mtop.life.diandian.getStoreList',
					v: '1.1',
					data: {
						'x': _this.dianData.x,
						'y': _this.dianData.y,
						'ibf': 0,
						'f': _this.dianData.f,
						'kw': _this.page.dian.kw,
						'cat': _this.dianData.cat,
						'p': _this.page.dian.p,
						'pz': _this.page.dian.pz,
						'city':_this.dianData.city,
						'o': _this.dianData.o
					},
					extParam: {}
				}, function(data) {
					var _data = data.data;

					if(_data) {
						_this.page.dian['total'] = _data.count;
						_this.page.dian['pageTotal'] = Math.ceil(parseInt(_data.count)/_this.page.dian.pz);

						//同步关键词
						_this.dianData.kw = _this.page.dian.kw;

						_this._buildList({storeList: _data.storeDList}, role);
						searchCache[k] = _data;
					}
					_this.async = false;
					//dd.ui.toast.hide();
				}, function(data) {
					_this.async = false;
					dd.ui.toast(data,_this);

					if(role=='add') {
						_this.page.dian.p--;
					}
				});
			},
			//外卖列表
			_getTakeoutStoreList: function(role){
				var _this = this;

				var k = _this.type+'_'+_this.default_address.posx+'_'+_this.default_address.posy+'_'+_this.deliveryData.taste_id+'_'+_this.deliveryData.average_price+'_'+_this.page.delivery.kw+'_'+_this.deliveryData.city+'_'+_this.page.delivery.p;
				var cached_data = searchCache[k];
				if(cached_data) {
					_this.deliveryData.key = _this.page.delivery.kw;
					_this._buildList({'storeList': cached_data.storeList||[]}, role);
					return;
				}

				if(_this.async) return;
				_this.async = true;
                var map = {
                    remark: ["page=", _this.page.delivery.p, ",pageSize=", _this.page.delivery.pz, ",src=1"].join(""),
                    rn: lib.encode.md5(Date.now() + Math.random().toString(32)).toLowerCase()
                }

				dd.ui.toast.loading();
				lib.mtop.request({
					api: 'mtop.life.diandian.takeoutStoreList',
					v: '1.0',
					data: {
						x: parseFloat(_this.default_address.posx),
						y: parseFloat(_this.default_address.posy),
						taste: parseInt(_this.deliveryData.taste_id),
						minp: 0,
						maxp: parseInt(_this.deliveryData.average_price),
						o: 0,
						key: _this.page.delivery.kw,
						p: _this.page.delivery.p,
						pz: _this.page.delivery.pz,
						city: _this.deliveryData.city,
                        statisticsInfo: JSON.stringify(map)
                    },
					extParam: {}
				}, function(data) {
					var _data = data.data;
					if(_data) {
						_this.page.delivery['total'] = _data.totalCount;
						_this.page.delivery['pageTotal'] = Math.ceil(parseInt(_data.totalCount)/_this.page.delivery.pz);

						//同步关键词
						_this.deliveryData.key = _this.page.delivery.kw;
						_this._buildList({'storeList': _data.storeList||[]}, role);
						searchCache[k] = _data;
					}
					_this.async = false;
					dd.ui.toast.hide();
				}, function(data) {
					_this.async = false;
					dd.ui.toast(data);
				});
			},
			//附近
			_getNearbyStoreList: function(role){
				var _this = this;

				var k = _this.type+'_'+_this.nearbyData.city+'_'+_this.nearbyData.x+'_'+_this.nearbyData.y+'_'+_this.page.nearby.kw+'_'+_this.nearbyData.o+'_'+_this.page.nearby.p;
				var cached_data = searchCache[k];
				if(cached_data) {
					_this.nearbyData.kw = _this.page.nearby.kw;
					_this._buildList({'storeList': cached_data.storeDList}, role);
					return;
				}

				if(_this.async) return;
				_this.async = true;

				dd.ui.toast.loading();
				lib.mtop.request({
					api: 'mtop.life.diandian.getStoreList',
					v: '1.1',
					data: {
						'x': _this.nearbyData.x,
						'y': _this.nearbyData.y,
						'p': _this.page.nearby.p,
						'ibf': 0,
						'city':_this.nearbyData.city,
						'kw': _this.page.nearby.kw,
						'pz': _this.page.nearby.pz,
						'f':'1,128,2048,4096,8192',
						'o': _this.nearbyData.o
					},
					extParam: {}
				}, function(data) {
					var _data = data.data;

					if(_data) {
						_this.page.nearby['total'] = _data.count;
						_this.page.nearby['pageTotal'] = Math.ceil(parseInt(_data.count)/_this.page.nearby.pz);

						//同步关键词
						_this.nearbyData.kw = _this.page.nearby.kw;
						_this._buildList({'storeList': _data.storeDList}, role);
						searchCache[k] = _data;
					}
					_this.async = false;
					dd.ui.toast.hide();
				}, function(data) {
					_this.async = false;
					dd.ui.toast(data);
				});
			},
			_buildList: function(data, role){
				var _this = this;
				data.referer = 'search/'+_this.type;
				data.type = _this.type;
				var tpl = dd.ui.tmpl(tpl_search_list.html(), data);

				if(role == 'init') {
					_this.searchUl.html('');
					//重置当前页码
					_this.page.index.p = 1;
					_this.page.delivery.p = 1;
					_this.page.nearby.p = 1;
				}

				_this.searchUl.append(tpl);

				if(_this._scroll) {
					_this._scroll.refresh();
				}else{
					_this._iScrollInit();
				}

				_this._listHandler();
			},
			//列表业务
			_listHandler: function(){
				var _this = this;

				//判断是否有翻页
				if(_this.type == 'index') {
					var page = _this.page.index;
					if(page['pageTotal'] > 1 && page['p'] < page['pageTotal']) {
						_this.pullup_el.removeClass('dn');
					}else{
						_this.pullup_el.addClass('dn');
					}
				}else if(_this.type == 'dian'){
					var page = _this.page.dian;
					if(page['pageTotal'] > 1 && page['p'] < page['pageTotal']) {
						_this.pullup_el.removeClass('dn');
					}else{
						_this.pullup_el.addClass('dn');
					}
				}else if(_this.type == 'delivery'){
					var page = _this.page.delivery;
					if(page['pageTotal'] > 1 && page['p'] < page['pageTotal']) {
						_this.pullup_el.removeClass('dn');
					}else{
						_this.pullup_el.addClass('dn');
					}
				}else if(_this.type == 'nearby'){
					var page = _this.page.nearby;
					if(page['pageTotal'] > 1 && page['p'] < page['pageTotal']) {
						_this.pullup_el.removeClass('dn');
					}else{
						_this.pullup_el.addClass('dn');
					}
				}
				

				_this._scroll && _this._scroll.refresh();
			},
			//切首页
			_switchIndex: function(){
				var _this = this;
				dd.lib.ddState({
					'back': {
						'ddid': 'index'
					}
				})
			},
			//
			_switchDian: function(){
				var _this = this;
				$('#J_dian').removeAttr('data-ddid');

				dd.lib.ddState({
					'back': {
						'ddid': 'dian'
					}
				})
			},
			//去外卖列表
			_switchDelivery: function(){
				var _this = this;
				$('#J_delivery').removeAttr('data-ddid');

				dd.lib.ddState({
					'back': {
						'ddid': 'delivery'
					}
				})
			},
			//去附近(首页搜索)
			_switchIndexNearby: function(){
				var _this = this;
				var ddid = 'nearby';
				var state_obj = {
					'push': {
						'ddid': ddid,
						'obj':{
							'referer': 'search/index'
						}
					}
				};
				dd.lib.memCache.set('update_nearby_index', _this.page.index.kw);
				$('#J_nearby').removeAttr('data-ddid');
				dd.lib.ddState(state_obj);
			},
			//去附近
			_switchNearby: function(){
				var _this = this;
				$('#J_nearby').removeAttr('data-ddid');

				dd.lib.ddState({
					'back': {
						'ddid': 'nearby'
					}
				})
			},
			//滚动初始化
			_iScrollInit: function(){
				var _this = this;
				var pullup_el = _this.pullup_el = search_panel.find('.J_pullUp');

				this._scroll = dd.ui._scroll({
					'wrap': '#J_search_scroll',
					'pullUpAction': function(){
						_this._pullUpAction()
					}
				})
				/*_this.mainScroll && _this.mainScroll.destroy();

				

				_this.mainScroll = dd.ui.scroll({
					'view': _this,
					'wrap': '#J_search_scroll',
					'pullUpAction': _this._pullUpAction
				});

				_this.mainScroll.on('beforeScrollStart', function(){
					document.activeElement.blur();
				})*/
			},
			_pullUpAction: function(){
				//加载
				var _this = this,
					page = _this.page;

				//页码+1
				if(_this.type == 'index') {
					page.index['p']++;
					_this._getIndexStoreList('add');
				}else if(_this.type == 'dian'){
					page.dian['p']++;
					_this._getDianStoreList('add');
				}else if(_this.type == 'delivery'){
					page.delivery['p']++;
					_this._getTakeoutStoreList('add');
				}else if(_this.type == 'nearby'){
					page.nearby['p']++;
					_this._getNearbyStoreList('add');
				}
				
			}
		}
	}

	dd.app.Search = function() {
		return new Search;
	};
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-我的外卖订单详情
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var atedetails_wrap = $('#J_atedetails'),
        tpl_atedetails = $('#J_tpl_atedetails');

    var History = window.History;

    function AteDetails() {
        return {
            wrap: atedetails_wrap,
            init: function (arg1) {
                var _this = this;

                _this.id = arg1;
                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function () {
            },
            //静态模板
            _renderStatic: function () {
                //loading
                atedetails_wrap.html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;

                lib.mtop.request({
                    api: 'mtop.life.diandian.getOtherOrderDetail',
                    v: '1.0',
                    data: {
                        'oid': _this.id
                    }
                }, function (data) {
                    _this._buildTmpl(data.data);
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            _buildTmpl: function (data) {
                var _this = this;
                var tpl = dd.ui.tmpl(tpl_atedetails.html(), {
                    data: data,
                    orderId: _this.id,
                    alt: History.getState().data.referer || 'delivery'
                });
                atedetails_wrap.html(tpl);
            }

        }
    }

    dd.app.AteDetails = function () {
        return new AteDetails;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-网友菜单列表
 */
(function($, window, dd) {
    var bridge = window.bridge;
    var atelist_wrap = $('#J_atelist'),
        tpl_atelist = $('#J_tplate_list'),
        tpl_atelist_item = $('#J_tpl_atelist_item');

    var History = window.History;

    function AteList() {
        return {
            wrap: atelist_wrap,
            init: function(arg1, arg2) {
                var _this = this;

                _this.type = arg1; //store本地商户 shop外卖店铺
                if (_this.type == 'store') {
                    // 还没有这种类型
                    _this.storeid = arg2;
                } else if (_this.type == 'shop') {
                    _this.shopid = arg2;
                }

                _this.page = {
                    'shop': {
                        'role': 'refresh', //刷新 或 翻页
                        'page_size': 20, //每页条数
                        'page_num': 1, //当前页
                        'total': 0, //订单总数
                        'pTotal': 1 //总页数
                    }
                }

                _this.initHandler();
            },
            initHandler: function() {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function() {},
            setAfterPageOut: function() {},
            //静态模板
            _renderStatic: function() {
                var _this = this;

                var options = {
                    'alt': History.getState().data.referer || _this.type + '/' + _this.shopid
                }

                var tpl = dd.ui.tmpl(tpl_atelist.html(), options);
                _this.wrap.html(tpl);

                _this.pullup_el = _this.wrap.find('.J_pullUp');

                _this.atelist_content = _this.wrap.find('#J_atelist_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function() {
                var _this = this;

                if (_this.type == 'shop') {
                    _this._getShopAteList();
                }
            },
            // 
            _getShopAteList: function() {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.getWaimaiOrderListForShop',
                    v: '1.0',
                    data: {
                        'pn': _this.page.shop.page_num,
                        'ps': _this.page.shop.page_size,
                        'id_s': _this.shopid
                    },
                    extParam: {}
                }, function(data) {
                    var _data = data.data;
                    _this.page.shop['total'] = parseInt(_data.total);
                    _this.page.shop['pTotal'] = Math.ceil(parseInt(_data.total) / _this.page.shop.page_size);

                    _this._buildTmpl(data.data);
                }, function(data) {
                    dd.ui.toast(data, _this);
                    if (_this.page.shop.role == 'add') {
                        _this.page.shop.page_num--;
                    }
                });
            },
            _buildTmpl: function(data) {
                var _this = this; //console.log(data);

                //刷新前清空
                if (_this.page[_this.type].role == 'refresh') {
                    _this.atelist_content.html('');

                    //重置当前页码
                    _this.page[_this.type].page_num = 1;
                }

                var options = {
                    shopdata: _this.type == 'shop' ? data : ''
                }
                
                var tpl = dd.ui.tmpl(tpl_atelist_item.html(), options);
                this.atelist_content.append(tpl);

                //判断是否有翻页
                var page_obj = _this.page[_this.type];
                if (page_obj['pTotal'] > 1 && page_obj['page_num'] < page_obj['pTotal']) {
                    _this.pullup_el.removeClass('dn');
                } else {
                    _this.pullup_el.addClass('dn');
                }

                if (_this.page[_this.type].role == 'refresh') {
                    _this._scrollInit();
                } else {
                    _this._scroll.refresh();
                }
            },
            //滚动初始化
            _scrollInit: function() {
                var _this = this;

                this._scroll = dd.ui._scroll({
                    'wrap': '#J_atelist_scroll',
                    'pullUpAction': function() {
                        _this._pullUpAction()
                    }
                })
            },
            _pullUpAction: function() {
                //加载
                var _this = this;

                _this.page[_this.type].page_num++;
                _this.page[_this.type].role = 'add';

                if (_this.type == 'shop') {
                    _this._getShopAteList();
                }
            }
        }
    }

    dd.app.AteList = function() {
        return new AteList;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-外卖店铺详情
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var shop_panel = $('#J_shop'),
        tpl_shop = $('#J_tpl_shop'),
        tpl_shop_content = $('#J_tpl_shop_content'),
        tpl_shop_coupon_list = $('#J_tpl_shop_coupon_list'), // 外卖券
        tpl_shop_tags_list = $('#J_tpl_shop_tags_list'); //外卖标

    var History = window.History;

    function Shop() {
        return {
            wrap: shop_panel,
            init: function (arg1) {
                var _this = this;

                _this.shopid = arg1;

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function () {
                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: dd.config.option_menu_icon.share
                }, function () {
                });
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'alt': History.getState().data.referer || 'index'
                }

                var tpl = dd.ui.tmpl(tpl_shop.html(), options);
                shop_panel.html(tpl);

                _this.shop_details_content = shop_panel.find('#J_shop_details_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                _this._getShopInfo();
            },
            events: [
                [dd.event.click, '.shop_address_wrap', '_pushMap']
            ],
            menuEvent: '_shareHandler',
            _pushMap: function () {
                var _this = this;
                if (_this.storeInfo) {
                    var v = 'address_map/show';
                    $('#J_address_map').removeAttr('data-ddid');

                    var state_obj = {
                        'push': {
                            'ddid': v,
                            'obj': {
                                'data': {
                                    posx: _this.storeInfo.longitude,
                                    posy: _this.storeInfo.latitude,
                                    areas: _this.storeInfo.areas && _this.storeInfo.areas
                                },
                                'referer': 'store/' + _this.shopid
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            },
            //商户
            _getShopInfo: function () {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.getShopDetail',
                    v: '1.0',
                    data: {
                        'id_s': _this.shopid,
                        "pz": "2", "p": "1"
                    },
                    extParam: {}
                }, function (data) {
                    if (data.data) {
                        _this.storeInfo = data.data;
                        _this._buildTmpl(data.data);
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            //分享
            _shareHandler: function () {
                var _this = this;
                var param = {
                    title: '发现了一个美食店铺！',
                    content: _this.storeInfo.name + ( _this.storeInfo.notice ? '：' + _this.storeInfo.notice : '' ),
                    image: ( _this.storeInfo.w_pic || dd.config.share.default_img) + '_145x145xz.jpg',
                    wb_image: ( _this.storeInfo.w_pic || dd.config.share.default_img ) + '_145x145xz.jpg',
                    wb_content: '#淘点点#发现了很赞的店铺' + _this.storeInfo.name + '，有时间一定要去去尝试下，详情点击：',
                    url: 'http://h5.m.taobao.com/dd/index.htm?_ddid=shop/' + _this.storeInfo.shopId
                }
                bridge.push("share", param);
            },
            _buildTmpl: function (data) {
                console.log(data)
                var _this = this;

                var tpl = dd.ui.tmpl(tpl_shop_content.html(), {'data': data});
                _this.startUp(tpl);

                _this._getVouchers();

                dd.common.delivery.getTags({
                    id: _this.shopid,
                    callback: function (data) {
                        _this._buildDeliveryTags(data)
                    }
                })

                _this._iScrollInit();
            },
            startUp: function (tpl) {
                this.shop_details_content.html(tpl);
            },
            // tab build
            _buildDeliveryTags: function (tagData) {
                var _this = this;
                if (!tagData.result || !tagData.result.length) {
                    return
                }

                var tpl = dd.ui.tmpl(tpl_shop_tags_list.html(), {result: tagData.result});

                _this.wrap.find('#J_shop_tags_box').html(tpl).show();
            },
            //外卖券
            _getVouchers: function () {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.dd.voucher.localstore.list',
                    v: '1.0',
                    data: {
                        'localstoreId': _this.shopid
                    },
                    extParam: {}
                }, function (data) {
                    if (data.data) {
                        _this._buildCoupon(data.data);
                    }
                }, function (data) {
                    dd.ui.toast(data);
                });
            },
            _buildCoupon: function (data) {
                console.log(data)
                var _this = this;
                if (parseInt(data.count) <= 0) {
                    return;
                }

                var tpl = dd.ui.tmpl(tpl_shop_coupon_list.html(), {data: data, shopid: _this.shopid});
                _this.wrap.find('#J_shop_coupon_box').html(tpl).show();
            },
            //滚动初始化
            _iScrollInit: function () {
                /*var _this = this;
                 _this.mainScroll && (_this.mainScroll.destroy() || (_this.mainScroll=null));

                 _this.mainScroll = dd.ui.scroll({
                 'view': _this,
                 'wrap': '#J_shop_scroll'
                 });*/
            }
        }
    }

    dd.app.Shop = function () {
        return new Shop;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-店铺详情
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var store_panel = $('#J_store'),
        tpl_store = $('#J_tpl_store'),
        tpl_store_content = $('#J_tpl_store_content');

    var History = window.History;

    function Store() {
        return {
            wrap: store_panel,
            init: function (arg1, arg2) {
                var _this = this;
                _this.wrap = store_panel;

                _this.storeid = arg1;

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function () {
                bridge.supportFunc("setOptionMenu") && bridge.push("setOptionMenu", {
                    icon: dd.config.option_menu_icon.share
                }, function () {
                });
            },
            setAfterPageOut: function () {
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'alt': 'dian'
                }

                var tpl = dd.ui.tmpl(tpl_store.html(), options);
                store_panel.html(tpl);

                _this.store_details_content = store_panel.find('#J_store_details_content').html(dd.ui.tpl.load);
            },
            //动态渲染
            _renderDynamic: function () {
                var _this = this;
                _this._getStoreInfo();
            },
            //商户
            _getStoreInfo: function () {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.getDetailInfo',
                    v: '1.0',
                    data: {
                        'localstore_id': _this.storeid,
                        'useNewEvoucher':1
                    },
                    extParam: {}
                }, function (data) {
                    if (data.data) {
                        _this.storeInfo = data.data;
                        _this._buildTmpl(data.data);
                        _this._getCard();
                        _this._getTags(data.data);
                        if (dd._hideTitleBar) {
                            bridge.push("setTitle", {
                                title: "店铺详情"
                            });
                        }
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            _getTags: function(d){
                var _this = this;
                if(!d.takeout){
                    return
                }
                lib.mtop.request({
                    api: 'mtop.life.diandian.getTags',
                    v: '1.0',
                    data: {
                        'storeId': _this.storeid,
                        'shopId': d.takeout.shopId
                    },
                    extParam: {}
                }, function (data) {
                    _this._buildTags(data.data);
                }, function (data) {
                    dd.ui.toast(data);
                });
            },
            // 获取会员卡信息
            _getCard: function () {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.getMemberCardHui',
                    v: '1.0',
                    data: {
                        'localStoreId': _this.storeid,
                        'sellerNick': _this.storeInfo.sellerNick
                    },
                    extParam: {}
                }, function (data) {
                    _this._buildStoreCard(data.data);
                }, function (data) {
                    dd.ui.toast(data);
                });
            },
            _buildTmpl: function (data) {
                var _this = this;

                _this.data = data;

                var tpl = dd.ui.tmpl(tpl_store_content.html(), {'data': data});
                _this.startUp(tpl);
                _this._businessProvide(_this.data);

                _this._getRecommend();
                _this._iScrollInit();
            },
            _buildTags: function(d){
                var _this = this;
                if(d.result.length){
                    var tpl='';
                    $.each(d.result,function(k,v){
                        tpl+='<li class="store_details_cu_con"><span class="store_details_cu"></span><span class="store_details_cu_desc">'+v.desc+'</span></li>';
                    });
                    $('#J_store_card_wrap').append(tpl);
                }
            },
            _buildStoreCard: function(data){
                var _this = this;
                if(!data.sellerNick) {
                    return
                }
                var tpl = '<ul class="shop_preferential" id="J_store_card_item"><li class="J_swipe_page" data-swipeid="store_card/'+ encodeURIComponent(data.sellerNick) +'" data-referer="store/'+ _this.storeInfo.storeId +'"><i class="comm_ic_arrow"></i><span class="name">'+ data.huiDesc +'</span><span class="shoplist_type_md">卡</span><span class="num"><spam class="card_vip_icon"></span></span></li></ul>';
                $('#J_store_card_wrap').html(tpl).show();
            },
            _renderRecommend: function (d) {
                var _this = this;
                if (d) {
                    var items = d.recommendMenuItems;
                    if (items) {
                        items = items.split("/");
                        var str = "";
                        for (var i = 0; i < items.length; i++) {
                            str += "<span>" + items[i] + "</span>";
                        }
                        var tpl = '<div class="comm_box_B"><h2 class="comm_down_line"><i class="comm_ic_arrow"></i>网友推荐菜<span>(' + d.totalCount + ')<span></h2><div class="shop_recommend_wrap clearfix">' + str +
                            '</div></div>';
                        $(".recommend_box").html(tpl).on("click", function () {
                            dd.lib.ddState({
                                'push': {
                                    'ddid': "carte/dian/" + _this.storeid,
                                    'obj': {
                                        'referer': 'store/' + _this.storeid
                                    }
                                }
                            })
                        });
                    } else {
                        $(".recommend_box").hide();
                    }
                }
            },
            _getRecommend: function () {
                var _this = this;
                lib.mtop.request({
                    api: 'mtop.life.diandian.getRecommendItems',
                    v: '1.0',
                    data: {
                        'localstoreId': _this.storeid
                    },
                    extParam: {}
                }, function (data) {
                    if (data.data) {
                        _this._renderRecommend(data.data);
                    }
                }, function (data) {
                    dd.ui.toast(data, _this);
                });
            },
            events: [
                [dd.event.click, '.li_address', '_pushMap'],
                [dd.event.click, '.show_all_preferential','_showAllPrefetential'],
                [dd.event.click, '.store_provides','_showAllProvides']
            ],
            menuEvent: '_shareHandler',
            _pushMap: function () {
                var _this = this;

                if (_this.storeInfo) {
                    var v = 'address_map/show';
                    $('#J_address_map').removeAttr('data-ddid');

                    var state_obj = {
                        'push': {
                            'ddid': v,
                            'obj': {
                                'data': {
                                    posx: _this.storeInfo.posx,
                                    posy: _this.storeInfo.posy
                                },
                                'referer': 'store/' + _this.storeid
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            },
            //展开全部商家提供
            _showAllProvides: function(){
                $('#J_ShowAllProvides').css('white-space','normal'),
                $('.show_all_arrow').hide();
            },
            //分享
            _shareHandler: function(){
                var _this = this;
                var param = {
                    title: '发现了一个美食店铺！',
                    content: _this.data.storeName + ( _this.data.notes ? '：'+_this.data.notes : '' ),
                    image: (_this.data.pictureUrl || dd.config.share.default_img ) + '_145x145xz.jpg',
                    wb_image: (_this.data.pictureUrl || dd.config.share.default_img ) + '_145x145xz.jpg',
                    wb_content: '#淘点点#发现了很赞的店铺'+ _this.data.storeName +'，有时间一定要去去尝试下，详情点击：',
                    url: 'http://h5.m.taobao.com/dd/index.htm?_ddid=store/' + _this.data.storeId
                }
                bridge.push("share", param);
            },
            //展开全部优惠
            _showAllPrefetential: function(){
                var _this = this;
                $('#J_PreferentialList').css('max-height','100%'),
                $('.show_all_preferential').hide();
            },
            startUp: function (tpl) {
                this.store_details_content.html(tpl);
            },
            //商家提供 
            _businessProvide: function(data){
                var Provide = $('.store_provides').children('ul');
                var storeProvides = {"credit":"刷卡","wifi":"wifi","box":"包厢"};
                var isNone = true;
                for (var key in storeProvides){
                    if (data[key]){
                        isNone = false;
                        Provide.append('<li>'+storeProvides[key]+'</li>')
                    }
                }

                if (!!data.parking){
                    isNone = false;
                    Provide.append('<li>'+data.parking+'</li>');
                }

                !isNone && Provide.show();
            },
            //滚动初始化
            _iScrollInit: function () {
                /*var _this = this;
                 _this.mainScroll && (_this.mainScroll.destroy() || (_this.mainScroll=null));

                 _this.mainScroll = dd.ui.scroll({
                 'view': _this,
                 'wrap': '#J_store_scroll'
                 });*/
            }
        }
    }

    dd.app.Store = function () {
        return new Store;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面-店铺详情
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    var store_card_wrap = $('#J_store_card'),
        tpl_store_card = $('#J_tpl_store_card'),
        tpl_store_card_content = $('#J_tpl_store_card_content');

    var History = window.History;

    function StoreCard() {
        return {
            wrap: store_card_wrap,
            init: function (arg1, arg2) {
                var _this = this;

                _this.sellerNick = arg1;

                _this.initHandler();
            },
            initHandler: function () {
                this._renderStatic();
                this._renderDynamic();
            },
            setAfterPageIn: function () {
            },
            setAfterPageOut: function () {
            },
            //静态模板
            _renderStatic: function () {
                var _this = this;

                var options = {
                    'alt': History.getState().data.referer || 'index'
                }

                var tpl = dd.ui.tmpl(tpl_store_card.html(), options);
                store_card_wrap.html(tpl);

                _this.card_details_content = _this.wrap.find('#J_card_details_content').html(dd.ui.tpl.load);
            },
            // 动态渲染
            _renderDynamic: function () {
                var _this = this;
                _this._getCard();
            },
            // 获取会员卡信息
            _getCard: function () {
                var _this = this;

                _this.geo_location = dd.lib.memCache.get('geo_location') || {};

                lib.mtop.request({
                    api: 'mtop.life.diandian.getMemberCardDetail',
                    v: '1.0',
                    data: {
                        'sellerNick': _this.sellerNick,
                        'latitude': _this.geo_location.latitude || 0,
                        'longitude': _this.geo_location.longitude || 0
                        // latitude: "30.23714",
                        // longitude: "120.17426"
                    },
                    extParam: {}
                }, function (data) {
                    _this._buildTmpl(data.data);
                }, function (data) {
                    dd.ui.toast(data);
                });
            },
            _buildTmpl: function (data) {
                var _this = this;

                //距离
                data.relateStores && $.each(data.relateStores, function(k, v){
                    var d = dd.lib.geoDistance(_this.geo_location, {
                            'longitude': v.longitude,
                            'latitude': v.latitude
                        });

                        var dtext;

                        //距离文案
                        if (d > 1000) {
                            dtext = d / 1000 > 100 ? '>100千米' : dd.lib.num2Fixed(d / 1000, 1) + '千米'
                        } else if (d == 0) {
                            dtext = '';
                        } else {
                            dtext = parseInt(d) + '米';
                        }

                        v.dtext = dtext;
                });

                var tpl = dd.ui.tmpl(tpl_store_card_content.html(), {data: data, sellerNick: _this.sellerNick});
                
                this.card_details_content.html(tpl);
            },
            events: [
                [dd.event.click, '#J_store_card_largess_btn', '_cardLargessHandler'],
                [dd.event.click, '.li_address', '_pushMap']
            ],
            // 领取
            _cardLargessHandler: function(e, el){
                var _this = this;
                if(_this.async) {
                    return
                }
                this.async = true;

                dd.ui.toast.loading();

                lib.mtop.request({
                    api: 'mtop.taobao.o2o.card.memberCard.ddFetch',
                    v: '1.0',
                    data: {
                        'sellerNick': _this.sellerNick
                    },
                    extParam: {}
                }, function (data) {
                    if(data.data.num) {
                        _this.initHandler();
                    }
                    this.async = false;
                    dd.ui.toast.hide();
                }, function (data) {
                    dd.ui.toast(data);
                    this.async = false;
                });
            },
            _pushMap: function (e, el) {
                var _this = this,
                    $el = $(el);

                if (_this.sellerNick) {
                    var v = 'address_map/show';
                    $('#J_address_map').removeAttr('data-ddid');

                    var state_obj = {
                        'push': {
                            'ddid': v,
                            'obj': {
                                'data': {
                                    posy: $el.data('latitude'),
                                    posx: $el.data('longitude')
                                },
                                'referer': 'store_card/' + _this.sellerNick
                            }
                        }
                    };
                    dd.lib.ddState(state_obj);
                }
            }
        }
    }

    dd.app.StoreCard = function () {
        return new StoreCard;
    };
})(Zepto, window, window['dd']);
/**
 * @Descript: H5页面app配置及全局事件
 */

$(function() {
    /*
     * html 区分android ios(5.11)
     */
    if(dd.device.iosStyle) {
        $('body').addClass('ios')
    }

    //修复
    if(dd.device.notSuppprtFixed){
        $('body').addClass('fixed-container');
    }

    /*
     * appcache update
     */
    window.applicationCache.addEventListener('updateready', function(e) {
        dd.ui.toast('页面更新中...');
        window.applicationCache.update();
        window.applicationCache.swapCache();
        setTimeout(function() {
            location.reload();
        }, 10);
    }, false);

    //隐藏alipay title
    //bridge.push("hideTitlebar");


    //iscroll
    document.addEventListener('touchmove', dd.event.touchmoveHandler, false);

    //横竖屏检测提示
    window.onorientationchange = orientationChange;
    orientationChange();

    function orientationChange() {
        if (window.orientation == 90 || window.orientation == -90) {
            dd.ui.toast('请使用竖屏模式，确保最佳体验!');
        }
    };

    //https://github.com/ftlabs/fastclick
    FastClick.attach(document.body)

    //设备地址监听
    $('body').on(dd.event.click+'.device', '.J_deviceuri', function() {
        dd.lib.deviceUri($(this).attr('data-uri'));
    });

    // 各入口执行定位
    dd.lib.getH5Geo();

    //所有展示页的view配置
    var options = {
        'defaultPage': 'index',
        'dataPage': {
            'index': {
                'view': dd.app.Index
            },
            /*'group': {
             'view': dd.app.Group
             },*/
            'dian': {
                'view': dd.app.Dian
            },
            'delivery': {
                'view': dd.app.Delivery
            },
            'delivery_hot': {
                'view': dd.app.DeliveryHot
            },
            'address': {
                'view': dd.app.Address
            },
            'address_operate': {
                'view': dd.app.AddressOperate
            },
            'my_address': {
                'view': dd.app.MyAddress
            },
            'address_map': {
                'view': dd.app.AddressMap
            },
            'carte': {
                'view': dd.app.Carte
                /*,
                 'reg': /^(carte)\/(\w*)\/(\w*)\/?(\w*)?(.*)?$/*/
            },
            'carte_intelligent': {
                'view': dd.app.CarteIntelligent
            },
            'carte_check': {
                'view': dd.app.CarteCheck
            },
            'carte_checkdelivery': {
                'view': dd.app.CarteCheckDelivery
            },
            'my': {
                'view': dd.app.My
            },
            'check': {
                'view': dd.app.Check
            },
            'pay_detail': {
                'view': dd.app.PayDetail
            },
            'pay_result': {
                'view': dd.app.PayResult
            },
            'my_order': {
                'view': dd.app.Myorder
            },
            'my_order_details': {
                'view': dd.app.MyOrderDetails
            },
            'my_delivery': {
                'view': dd.app.MyDelivery
            },
            'my_delivery_details': {
                'view': dd.app.MyDeliveryDetails
            },
            'my_delivery_refund': {
                'view': dd.app.MyDeliveryRefund
            },
            'my_pay': {
                'view': dd.app.MyPay
            },
            'my_pay_details': {
                'view': dd.app.MyPayDetails
            },
            'my_evoucher': {
                'view': dd.app.MyEvoucher
            },
            'my_evoucher_details': {
                'view': dd.app.MyEvoucherDetails
            },
            'my_evoucher_shoplist': {
                'view': dd.app.MyEvoucherShopList
            },
            /*'nearby': {
             'view': dd.app.Nearby
             },*/
            'carte_index': {
                'view': dd.app.CarteIndex
            },
            'store': {
                'view': dd.app.Store
            },
            'store_card': {
                'view': dd.app.StoreCard
            },
            'shop': {
                'view': dd.app.Shop
            },
            'review': {
                'view': dd.app.Review
            },
            'reviewlist': {
                'view': dd.app.ReviewList
            },
            'atelist': {
                'view': dd.app.AteList
            },
            'atedetails': {
                'view': dd.app.AteDetails
            },
            'search': {
                'view': dd.app.Search
            },
            'city': {
                'view': dd.app.City
            },
            'city_all': {
                'view': dd.app.CityAll
            },
            'evoucher': {
                'view': dd.app.Evoucher
            },
            'evoucher_buy': {
                'view': dd.app.EvoucherBuy
            },
            /*预定*/
            'reserve_shops': {
                'view': dd.app.ReserveShops
            },
            'reserve_datelist': {
                'view': dd.app.ReserveDatelist
            },
            'reserve_date': {
                'view': dd.app.ReserveDate
            },
            'reserve_confirm': {
                'view': dd.app.ReserveConfirm
            },
            'my_reserve': {
                'view': dd.app.MyReserve
            },
            'my_reserve_details': {
                'view': dd.app.MyReserveDetails
            },
            'my_customer_service': {
                'view': dd.app.MyCustomerService
            },
            'my_feedback': {
                'view': dd.app.MyFeedBack
            }
        }
    };
    var sp = dd.StatePage(options);
    sp.init();

});
