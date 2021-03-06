import {
    StyleSheet,
    View,
} from 'react-native';
import fa from '../../utils/fa'
import OrderModel from '../../models/order'
import React, { Component } from 'react';
import { Modal, WhiteSpace } from "antd-mobile-rn";
import {
    OrderStateCard,
    OrderAddress,
    OrderGoodsList,
    OrderBaseInfo,
    OrderCostList,
    OrderFooterAction
} from '../../components'
import { connect } from "react-redux";
import { sendWechatAuthRequest, wechatPay } from "../../actions/app/wechat";

const orderModel = new OrderModel()

@connect(
    ({
         app: {
             user: {
                 login,
                 userInfo,
             }
         }
     }) => ({
        login,
        userInfo,
    }),
)
export default class OrderDetail extends Component {
    state = {
        id: null,
        orderInfo: null,
        orderLog: null,
    }

    onRefund(goodsInfo) {
        const orderInfo = this.state.orderInfo
        // 根据类型跳转到是退款还是退款退货  订单状态：0(已取消)10(默认):未付款;20:已付款;30:已发货;40:已收货;    多少天后不可退的业务逻辑
        if (orderInfo.state === 20) {
            // 直接跳转到申请发货
            this.props.navigation.navigate('RefundServiceApply', {
                order_goods_id: goodsInfo.id,
                refund_type: 1
            })

        } else if (orderInfo.state === 30 || orderInfo.state === 40) {
            // 选择是退款还是退款并退货
            this.props.navigation.navigate('RefundServiceType', {
                order_goods_id: goodsInfo.id,
            })
        }
    }

    onRefundDetail(goodsInfo) {
        this.props.navigation.navigate('RefundDetail', {
            id: goodsInfo.refund_id,
        })
    }


    componentWillMount() {
        this.setState({
            id: this.props.navigation.getParam('id')
        }, () => {
            console.log('set ok')
            this.props.navigation.addListener(
                'didFocus', async () => {
                    this.init()
                }
            );
        })

    }

    async init() {
        const result = await orderModel.detail({ id: this.state.id })
        if (result) {
            this.setState({
                orderInfo: result.info,
                orderLog: result.order_log
            })
        }
    }

    onGoodsDetail(goodsInfo) {
        this.props.navigation.navigate('GoodsDetail', {
            id: goodsInfo.goods_id,
        })
    }

    async onCancel() {
        Modal.alert('您确认取消吗？状态修改后不能变更', null, [
            { text: '取消', onPress: () => console.log('cancel'), style: 'cancel' },
            {
                text: '确认', onPress: async () => {
                    const { orderInfo } = this.state
                    const result = await orderModel.cancel({
                        'id': orderInfo.id,
                    })
                    if (result) {
                        this.init()
                        this.updateListRow(orderInfo.id)
                    } else {
                        fa.toast.show({
                            title: fa.code.parse(orderModel.getException().getCode())
                        })
                    }
                }
            }
        ])
    }

    onEvaluate() {
        const { orderInfo } = this.state
        this.props.navigation.navigate('EvaluateList', {
            order_id: orderInfo.id,
        })
    }

    async onReceive() {
        Modal.alert('您确认收货吗？状态修改后不能变更', null, [
            { text: '取消', onPress: () => console.log('cancel'), style: 'cancel' },
            {
                text: '确认', onPress: async () => {
                    const { orderInfo } = this.state
                    const result = await orderModel.confirmReceipt({
                        'id': orderInfo.id,
                    })
                    if (result) {
                        this.init()
                        this.updateListRow(orderInfo.id)
                    } else {
                        fa.toast.show({
                            title: fa.code.parse(orderModel.getException().getCode())
                        })
                    }
                }
            }
        ])
    }

    async onPay() {
        const { dispatch } = this.props;
        const { orderInfo } = this.state;
        const { tokenData } = await sendWechatAuthRequest()
        const params = {
            order_type: 'goods_buy',
            pay_sn: orderInfo.pay_sn,
            payment_code: 'wechat',
            openid: tokenData.openid,
            payment_channel: 'wechat_app' // 支付渠道 "wechat"  "wechat_mini" "wechat_app"
        }
        dispatch(wechatPay({ params }))
    }

    updateListRow = () => {
        const { id } = this.state
        if (id > 0) {
            this.props.navigation.dispatch(StackActions.pop({ n: 1 }));
            const updateListRow = this.props.navigation.getParam('updateListRow')
            if (typeof updateListRow === 'function') {
                updateListRow(id)
            }
        }
    }


    render() {
        const { orderInfo } = this.state
        return orderInfo ? <View>
            <View style={styles.main}>
                <View style={styles.item}>
                    <OrderStateCard
                        orderState={orderInfo.state}
                        expireSeconds={1000}
                        cost={orderInfo.amount}
                    />

                    <OrderAddress
                        name={orderInfo.extend_order_extend.reciver_name}
                        phone={orderInfo.extend_order_extend.receiver_phone}
                        address={orderInfo.extend_order_extend.reciver_name}
                    />
                    <WhiteSpace size="sm" />
                </View>

                <View style={styles.item}>
                    <OrderGoodsList
                        orderInfo={orderInfo}
                        goodsList={orderInfo.extend_order_goods}
                        onGoodsDetail={({ goodsInfo }) => {
                            this.onGoodsDetail(goodsInfo)
                        }}
                        onRefund={({ goodsInfo }) => {
                            this.onRefund(goodsInfo)
                        }}
                        onRefundDetail={({ goodsInfo }) => {
                            this.onRefundDetail(goodsInfo)
                        }}
                    />
                    <WhiteSpace size="sm" />
                </View>
                <View style={styles.item}>
                    <OrderBaseInfo
                        orderInfo={orderInfo}
                        orderNumber={orderInfo.sn}
                        createTime={orderInfo.create_time}
                        payment="微信支付"
                        payTime={orderInfo.payment_time}
                    />
                    <WhiteSpace size="sm" />
                </View>
                <View style={styles.item}>
                    <OrderCostList
                        goodsTotal={orderInfo.goods_amount}
                        freight={orderInfo.freight_fee}
                        totalCost={orderInfo.amount} />
                    <OrderFooterAction
                        orderInfo={orderInfo}
                        orderState={orderInfo.state}
                        showDelBtn={false}
                        showEvaluateBtn={orderInfo.if_evaluate}
                        showPayBtn={orderInfo.if_pay}
                        showLogisticsBtn={orderInfo.showLogisticsBtn}
                        showReceiveBtn={orderInfo.if_receive}
                        onPay={() => {
                            this.onPay()
                        }}
                        onReceive={() => {
                            this.onReceive()
                        }}
                        onCancel={() => {
                            this.onCancel()
                        }}
                        onEvaluate={() => {
                            this.onEvaluate()
                        }}
                    />
                </View>
            </View>
        </View> : null
    }
}
const styles = StyleSheet.create({
    main: {
        backgroundColor: '#f8f8f8',
    },
    item: {}
})
