import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    SafeAreaView,
} from 'react-native';
import fa from '../../../utils/fa'
import AddressModel from '../../../models/address'
import AreaModel from '../../../models/area'
import { Button } from 'antd-mobile-rn';
import { Field } from '../../../components'
import arrayTreeFilter from "array-tree-filter";
import { StackActions } from "react-navigation";

const addressModel = new AddressModel()
const areaModel = new AreaModel()

export default class UserAddressAdd extends Component {
    state = {
        truename: '',
        mobile_phone: '',
        type: '个人',
        area_id: '',
        address: '',
        is_default: 1,

        onLoaded: false,
        checked: true,
        areaList: [],
        combine_detail: null,

    }

    async componentWillMount() {
        const areaCache = await fa.cache.get('area_list_level2')
        const areaResult = areaCache ? areaCache : await areaModel.list({ level: 2 })
        this.setState({
            areaList: fa.getAntAreaList(areaResult.list),
            onLoaded: true
        })
    }

    onAreaChange({ value }) {
        const { areaList } = this.state
        const treeChildren = arrayTreeFilter(
            areaList, (item, level) => item.value === value[level]
        );

        this.setState({
            area_id: value[2],
            combine_detail: treeChildren.map(v => {
                return v.label;
            }).join(' ')
        })
    }

    onTruenameChange({ value }) {
        this.setState({
            truename: value
        })
    }

    onMobilePhoneChange({ value }) {
        this.setState({
            mobile_phone: value
        })
    }

    onAddressChange({ value }) {
        this.setState({
            address: value
        })
    }

    onIsDefaultChange({ value }) {
        this.setState({
            is_default: value ? 1 : 0
        })
    }

    async onSubmit() {
        const { truename, mobile_phone, area_id, address, is_default, type } = this.state
        if (!truename) {
            return fa.toast.show({ title: '请输入姓名' })
        }
        if (!mobile_phone) {
            return fa.toast.show({ title: '请输入手机号' })
        }
        if (!area_id) {
            return fa.toast.show({ title: '请选择所在地区' })
        }
        if (!address) {
            return fa.toast.show({ title: '请填写楼栋楼层或房间号信息' })
        }
        let data = {
            truename,
            mobile_phone,
            address,
            is_default,
            type,
            area_id
        }

        const result = await addressModel.add(data)
        if (result === false) {
            fa.toast.show({
                title: fa.code.parse(addressModel.getException().getCode())
            })
        } else {
            this.props.navigation.dispatch(StackActions.pop({ n: 1 }));
            const updateListRow = this.props.navigation.getParam('updateListRow')
            if (typeof updateListRow === 'function') {
                updateListRow(null)
            }
        }
    }

    render() {
        const {
            truename,
            mobile_phone,
            address,
            is_default,
            combine_detail,
            areaList,
            onLoaded
        } = this.state
        return onLoaded ? [<View style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#fff' }}>
                <Field
                    title="收货人："
                    placeholder="请输入姓名"
                    focus={true}
                    value={truename}
                    onChange={(e) => {
                        this.onTruenameChange(e)
                    }}
                >
                </Field>
                <Field
                    title="联系方式："
                    inputType="numeric"
                    placeholder="请输入手机号"
                    value={mobile_phone}
                    onChange={(e) => {
                        this.onMobilePhoneChange(e)
                    }}
                >2
                </Field>
                <Field
                    title="所在地区："
                    type={'area'}
                    areaList={areaList}
                    value={[]}
                    areaNames={combine_detail ? combine_detail : '请选择地区'}
                    onChange={(e) => {
                        this.onAreaChange(e)
                    }}
                >
                </Field>
                <Field
                    title="详细地址："
                    value={address}
                    placeholder="填写楼栋楼层或房间号信息"
                    onChange={(e) => {
                        this.onAddressChange(e)
                    }}
                >
                </Field>
                <Field
                    title="设置默认地址："
                    desc="注：每次下单时会使用该地址"
                    type={'switch'}
                    checked={is_default === 1}
                    onChange={(e) => {
                        this.onIsDefaultChange(e)
                    }}
                >
                </Field>
            </View>
        </View>, <SafeAreaView style={styles.buttonArea}>
            <Button style={{ borderRadius: 0, flex: 1 }} type={'warning'} size="large" onClick={() => {
                this.onSubmit()
            }}>保存</Button></SafeAreaView>] : null
    }
}
const styles = StyleSheet.create({
    buttonArea: {
        justifyContent: "space-between",
        flexDirection: 'row',
        padding: 15
    },
})
